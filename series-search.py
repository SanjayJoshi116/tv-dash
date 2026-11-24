import os
import requests
import csv
import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# TMDB API key — set via env var, never hardcode
api_key = os.environ.get("TMDB_API_KEY")
if not api_key:
    raise RuntimeError("Set TMDB_API_KEY environment variable before running.")

# Create a session with retries and a user-agent
session = requests.Session()
retry_strategy = Retry(
    total=3,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"],
    backoff_factor=2
)
adapter = HTTPAdapter(max_retries=retry_strategy)
session.mount("https://", adapter)
# Sent with every request — requests also URL-encodes params (e.g. a '&' in a search term)
session.headers.update({'User-Agent': 'Mozilla/5.0'})
session.params = {"api_key": api_key}

BASE_URL = "https://api.themoviedb.org/3"
# The file the dashboard fetches — resolved from this script, not the working directory
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "tv_series.csv")

# CSV contract with the dashboard (src/utils/parseSeriesCsv.ts) — column order of new files
FIELDNAMES = [
    "TV ID", "Name", "Language", "Seasons", "Episode Runtime", "First Air Year",
    "Genres", "Creators", "Networks", "Status", "Total Episodes", "Last Episode Air Date",
    "Popularity", "Vote Count", "Vote Average", "Actors/Actresses", "Keywords/Tags",
    "First Air Date", "Overview", "Tagline", "Poster URL", "Age Rating",
    "Seasons Watched", "Episodes Watched", "Total Runtime Watched (min)",
]
TABLE_COLUMNS = FIELDNAMES[:6]  # shown in the search table (display only)

# Global variables for pagination
current_page = 1
total_pages = 1
loading = False  # a search/details load is running — new searches are ignored until it ends

def _tmdb_get(path, default, error_title="Error", error_msg="Failed to fetch data", quiet=False, **params):
    """GET a TMDB endpoint; on failure show an error (unless quiet) and return `default`.
    Pass quiet=True from worker threads — Tk dialogs must only be opened on the main thread."""
    try:
        response = session.get(f"{BASE_URL}{path}", params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, ValueError) as e:  # ValueError: non-JSON body
        if not quiet:
            messagebox.showerror(error_title, f"{error_msg}:\n{e}")
        return default

def search_tv(tv_name, page=1):
    return _tmdb_get("/search/tv", {"results": [], "total_pages": 1},
                     "Connection Error", "Failed to fetch data from TMDB", query=tv_name, page=page)

# Successful detail responses by TV ID. One request carries credits, keywords and US rating
# (append_to_response), and the save path reuses what the search table already fetched.
_details_cache = {}

def fetch_tv_details(tv_id, quiet=False):
    key = str(tv_id)
    if key not in _details_cache:
        details = _tmdb_get(f"/tv/{tv_id}", None, error_msg="Failed to fetch details", quiet=quiet,
                            append_to_response="credits,keywords,content_ratings")
        if details is None:
            return {}
        _details_cache[key] = details
    return _details_cache[key]

def fetch_season_details(tv_id, season_number):
    """Episode list, or None if the fetch failed (error already shown) — not [], which would
    record the season as watched with 0 episodes."""
    data = _tmdb_get(f"/tv/{tv_id}/season/{season_number}", None,
                     error_msg=f"Failed to fetch season {season_number} details")
    return None if data is None else data.get("episodes", [])

def us_certification(details):
    for entry in details.get("content_ratings", {}).get("results", []):
        if entry.get("iso_3166_1") == "US":
            return entry.get("rating") or ""
    return ""

# Unknown values are written as '' (not 'N/A') — the dashboard reads blank as unknown
def field(details, key):
    value = details.get(key)
    return "" if value is None else value

def new_row(tv_id, details):
    """CSV row for a show not yet in the file (watch-progress columns filled in by the caller)."""
    run_times = details.get("episode_run_time") or []
    poster_path = details.get("poster_path")
    return {
        "TV ID": tv_id,
        "Name": field(details, "name"),
        "Language": field(details, "original_language"),
        "Seasons": field(details, "number_of_seasons"),
        "Episode Runtime": run_times[0] if run_times else "",
        "First Air Year": (details.get("first_air_date") or "").split("-")[0],
        "Genres": names(details.get("genres", [])),
        "Creators": names(details.get("created_by", [])),
        "Networks": names(details.get("networks", [])),
        "Status": field(details, "status"),
        "Total Episodes": field(details, "number_of_episodes"),
        "Last Episode Air Date": field(details, "last_air_date"),
        "Popularity": field(details, "popularity"),
        "Vote Count": field(details, "vote_count"),
        "Vote Average": field(details, "vote_average"),
        "Actors/Actresses": names(details.get("credits", {}).get("cast", []), limit=5),
        "Keywords/Tags": names(details.get("keywords", {}).get("results", [])),
        "First Air Date": field(details, "first_air_date"),
        "Overview": field(details, "overview"),
        "Tagline": field(details, "tagline"),
        "Poster URL": f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else "",
        "Age Rating": us_certification(details),
    }

def names(items, limit=None):
    return ", ".join(item["name"] for item in items[:limit])

def load_rows():
    """(fieldnames, rows) of the existing CSV, or (None, []) if there is none."""
    try:
        with open(CSV_PATH, mode="r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            return reader.fieldnames, list(reader)
    except FileNotFoundError:
        return None, []

def get_existing_entry(tv_id):
    _, rows = load_rows()
    return next((row for row in rows if row.get("TV ID") == str(tv_id)), None)

def update_csv_row(tv_id, updated_row):
    fieldnames, rows = load_rows()
    if fieldnames is None:
        return
    rows = [updated_row if row.get("TV ID") == str(tv_id) else row for row in rows]
    with open(CSV_PATH, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def append_to_csv(tv_details):
    # Follow the existing file's header (an older or hand-edited file may differ from FIELDNAMES)
    # so the new row's values land under the right columns; FIELDNAMES only for a new file
    header, _ = load_rows()
    if header:
        missing = [c for c in FIELDNAMES if c not in header]
        if missing:
            messagebox.showwarning("CSV Columns", "tv_series.csv has no column for: " + ", ".join(missing)
                                   + "\nThose values are not saved for this show.")
    else:
        os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    with open(CSV_PATH, mode="a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=header or FIELDNAMES, restval="", extrasaction="ignore")
        if not header:
            writer.writeheader()
        writer.writerow(tv_details)
    messagebox.showinfo("Success", "TV series details saved to CSV file")

def set_loading(state):
    global loading
    loading = state
    status_label.config(text="Loading..." if state else "")
    for btn in [search_button, next_page_button, prev_page_button]:
        btn.config(state="disabled" if state else "normal")

def show_season_panel(seasons, already_saved, on_confirm):
    real_seasons = [s for s in seasons if s.get("season_number", 0) != 0]
    new_seasons = [s for s in real_seasons if s["season_number"] not in already_saved]

    if not new_seasons:
        messagebox.showinfo("All Seasons Saved", "All seasons for this series are already saved.")
        return

    popup = tk.Toplevel(root)
    popup.title("Select Seasons Watched")
    popup.resizable(False, False)
    popup.grab_set()

    tk.Label(popup, text="Seasons Watched", font=FONT_BOLD).pack(pady=(10, 4))
    ttk.Separator(popup, orient="horizontal").pack(fill="x", padx=6, pady=(0, 6))

    vars_ = {}       # new (selectable) seasons only: sn -> (var, ep_count)
    saved_vars = []  # disabled, pre-checked vars for saved seasons
    select_all_var = tk.BooleanVar()

    def toggle_select_all():
        state = select_all_var.get()
        for var, _ in vars_.values():
            var.set(state)

    tk.Checkbutton(
        popup,
        text="Select All",
        variable=select_all_var,
        command=toggle_select_all,
        anchor="w",
        font=FONT_BOLD
    ).pack(fill="x", padx=10, pady=(0, 4))

    ttk.Separator(popup, orient="horizontal").pack(fill="x", padx=6, pady=(0, 4))

    for season in real_seasons:
        sn = season["season_number"]
        ep_count = season.get("episode_count", 0)
        saved = sn in already_saved
        var = tk.BooleanVar(value=saved)
        tk.Checkbutton(
            popup,
            text=f"Season {sn}  ({ep_count} eps)  [saved]" if saved else f"Season {sn}  ({ep_count} episodes)",
            variable=var,
            anchor="w",
            font=FONT,
            **({"state": "disabled", "fg": "gray"} if saved else {})
        ).pack(fill="x", padx=12)

        if saved:
            saved_vars.append(var)
        else:
            vars_[sn] = (var, ep_count)
    popup.saved_vars = saved_vars  # outlive this function — a freed BooleanVar unchecks its box

    def on_confirm_click():
        selected = {sn: ep_count for sn, (var, ep_count) in vars_.items() if var.get()}
        popup.destroy()
        on_confirm(selected)

    tk.Button(
        popup,
        text="Confirm",
        command=on_confirm_click,
        font=FONT
    ).pack(pady=12)

def fetch_and_display_tv(tv_name):
    global total_pages
    if loading:  # Enter pressed mid-load: the running load still owns the table
        return
    set_loading(True)
    response = search_tv(tv_name, current_page)
    tv_series = response.get("results", [])
    total_pages = response.get("total_pages", 1)

    if not tv_series:
        messagebox.showinfo("No Results", "No TV series found for the given name")
        set_loading(False)
        return

    for widget in table_frame.winfo_children():
        widget.destroy()

    tree = ttk.Treeview(table_frame, columns=TABLE_COLUMNS, show="headings")

    sort_reverse = {}

    def sort_column(col):
        rows = [(tree.set(iid, col), iid) for iid in tree.get_children("")]
        try:
            rows.sort(key=lambda x: float(x[0].replace("—", "0")), reverse=sort_reverse.get(col, False))
        except ValueError:
            rows.sort(key=lambda x: x[0].lower(), reverse=sort_reverse.get(col, False))
        for i, (_, iid) in enumerate(rows):
            tree.move(iid, "", i)
        sort_reverse[col] = not sort_reverse.get(col, False)

    for col in TABLE_COLUMNS:
        tree.heading(col, text=col, command=lambda c=col: sort_column(c))
        tree.column(col, width=150, anchor="center")

    item_map = {}
    for tv in tv_series:
        tv_id = tv.get("id", "N/A")
        first_air_year = tv.get("first_air_date", "").split("-")[0] if tv.get("first_air_date") else "N/A"
        iid = tree.insert("", "end", values=(
            tv_id,
            tv.get("name", "N/A"),
            tv.get("original_language", "N/A"),
            "—",
            "—",
            first_air_year
        ))
        item_map[str(tv_id)] = iid

    def fetch_all_details():
        # Worker thread: no dialogs here (quiet fetches) — failures are reported once on the main thread
        failed = 0
        try:
            with ThreadPoolExecutor(max_workers=6) as executor:
                futures = {
                    executor.submit(fetch_tv_details, tid, True): (tid, iid)
                    for tid, iid in item_map.items()
                }
                for future in as_completed(futures):
                    tid, iid = futures[future]
                    try:
                        details = future.result()
                    except Exception:
                        details = {}
                    if not details:
                        failed += 1
                        continue
                    seasons = details.get("number_of_seasons", "N/A")
                    run_times = details.get("episode_run_time", [])
                    runtime = run_times[0] if run_times else "N/A"
                    root.after(0, lambda i=iid, s=seasons, r=runtime: (
                        tree.set(i, "Seasons", s),
                        tree.set(i, "Episode Runtime", r)
                    ))
        finally:
            root.after(0, lambda: set_loading(False))  # always re-enable the buttons
            if failed:
                root.after(0, lambda: messagebox.showerror(
                    "Error", f"Failed to fetch details for {failed} show(s). They are fetched again on save."))

    threading.Thread(target=fetch_all_details, daemon=True).start()

    def save_selected_to_csv():
        selected_item = tree.selection()
        if len(tree.get_children()) == 1:
            selected_item = tree.get_children()

        if not selected_item:
            messagebox.showwarning("Selection Required", "Please select a TV series from the list")
            return

        for item in selected_item:
            values = tree.item(item, "values")
            tv_id = values[0]

            details = fetch_tv_details(tv_id)  # cached from the table fetch; includes credits etc.
            if not details:  # fetch failed (error already shown) — don't claim all seasons are saved
                continue
            seasons = details.get("seasons", [])

            existing = get_existing_entry(tv_id)
            if existing:
                saved_str = existing.get("Seasons Watched", "")
                already_saved = {int(s) for s in saved_str.split(",") if s.strip().isdigit()}
            else:
                already_saved = set()

            def do_save(selected_seasons, tv_id=tv_id, details=details, existing=existing,
                        already_saved=already_saved):
                if not selected_seasons:
                    messagebox.showinfo("No Selection", "No new seasons were selected.")
                    return

                episodes_watched = 0
                total_runtime_min = 0
                fetched = []
                for sn in selected_seasons:
                    episodes = fetch_season_details(tv_id, sn)
                    if episodes is None:  # failed — leave it unsaved so it can be re-added later
                        continue
                    fetched.append(sn)
                    episodes_watched += len(episodes)
                    total_runtime_min += sum(ep.get("runtime") or 0 for ep in episodes)
                failed = sorted(set(selected_seasons) - set(fetched))
                if not fetched:
                    messagebox.showwarning("Not Saved", f"Could not fetch season(s) {failed}. Nothing was saved.")
                    return

                new_saved = already_saved | set(fetched)
                seasons_watched_str = ",".join(str(s) for s in sorted(new_saved))

                if existing:
                    prev_episodes = int(existing.get("Episodes Watched") or 0)
                    prev_runtime = int(existing.get("Total Runtime Watched (min)") or 0)
                    updated_row = dict(existing)
                    updated_row["Episodes Watched"] = prev_episodes + episodes_watched
                    updated_row["Total Runtime Watched (min)"] = prev_runtime + total_runtime_min
                    updated_row["Seasons Watched"] = seasons_watched_str
                    update_csv_row(tv_id, updated_row)
                    msg = f"Season(s) {sorted(fetched)} added. CSV updated."
                    if failed:
                        msg += f"\nSeason(s) {failed} failed to fetch and were not saved."
                    messagebox.showinfo("Updated", msg)
                else:
                    # From the full details, not the table cells (those may still show '—')
                    tv_details = {
                        **new_row(tv_id, details),
                        "Seasons Watched": seasons_watched_str,
                        "Episodes Watched": episodes_watched,
                        "Total Runtime Watched (min)": total_runtime_min,
                    }
                    append_to_csv(tv_details)
                    if failed:
                        messagebox.showwarning("Partly Saved", f"Season(s) {failed} failed to fetch and were not saved.")

            show_season_panel(seasons, already_saved, do_save)

    tree.pack(fill=tk.BOTH, expand=True)
    save_button.config(command=save_selected_to_csv)

# Paging handlers check `loading` before touching current_page: fetch_and_display_tv drops a
# call made mid-load, and a page change made first would leave the counter out of sync with the table
def on_search_click():
    global current_page
    if loading:
        return
    tv_name = entry.get()
    if not tv_name:
        messagebox.showwarning("Input Required", "Please enter a TV series name")
        return
    current_page = 1
    fetch_and_display_tv(tv_name)

def on_next_page_click():
    global current_page
    if loading:
        return
    if current_page < total_pages:
        current_page += 1
        fetch_and_display_tv(entry.get())
    else:
        messagebox.showinfo("End of Results", "No more pages available.")

def on_prev_page_click():
    global current_page
    if loading:
        return
    if current_page > 1:
        current_page -= 1
        fetch_and_display_tv(entry.get())
    else:
        messagebox.showinfo("Start of Results", "You are on the first page.")

# GUI setup
root = tk.Tk()
root.title("TMDB TV Series Search")
root.geometry("1100x660")
root.minsize(800, 500)

FONT_FAMILY = "TkDefaultFont"
FONT = (FONT_FAMILY, 12)
FONT_BOLD = (FONT_FAMILY, 12, "bold")

style = ttk.Style()
style.configure("Treeview", font=(FONT_FAMILY, 11), rowheight=28)
style.configure("Treeview.Heading", font=(FONT_FAMILY, 11, "bold"))

tk.Label(root, text="Enter TV Series Name:", font=FONT).pack(pady=(10, 2))
entry = tk.Entry(root, width=45, font=(FONT_FAMILY, 13))
entry.pack(ipady=5)
entry.bind("<Return>", lambda e: on_search_click())

search_button = tk.Button(root, text="Search", command=on_search_click, font=FONT)
search_button.pack(pady=(6, 2))

status_label = tk.Label(root, text="", fg="gray", font=FONT)
status_label.pack()

table_frame = tk.Frame(root)
table_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=(4, 0))

save_button = tk.Button(root, text="Save to CSV", font=FONT)
save_button.pack(pady=4)

nav_frame = tk.Frame(root)
nav_frame.pack(pady=(0, 8))
prev_page_button = tk.Button(nav_frame, text="Previous Page", command=on_prev_page_click, font=FONT)
prev_page_button.pack(side=tk.LEFT, padx=8)
next_page_button = tk.Button(nav_frame, text="Next Page", command=on_next_page_click, font=FONT)
next_page_button.pack(side=tk.LEFT, padx=8)

root.mainloop()
