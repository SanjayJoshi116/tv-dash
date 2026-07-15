import os
import requests
import csv
import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import time
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

headers = {'User-Agent': 'Mozilla/5.0'}

# Global variables for pagination
current_page = 1
total_pages = 1

def search_tv(api_key, tv_name, page=1):
    url = f"https://api.themoviedb.org/3/search/tv?api_key={api_key}&query={tv_name}&page={page}"
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        messagebox.showerror("Connection Error", f"Failed to fetch data from TMDB:\n{e}")
        return {"results": [], "total_pages": 1}

def fetch_tv_details(api_key, tv_id):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}?api_key={api_key}"
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        messagebox.showerror("Error", f"Failed to fetch details:\n{e}")
        return {}

def fetch_tv_credits(api_key, tv_id):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}/credits?api_key={api_key}"
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        messagebox.showerror("Error", f"Failed to fetch credits:\n{e}")
        return {}

def fetch_tv_keywords(api_key, tv_id):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}/keywords?api_key={api_key}"
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get("results", [])
    except requests.exceptions.RequestException as e:
        messagebox.showerror("Error", f"Failed to fetch keywords:\n{e}")
        return []

def fetch_season_details(api_key, tv_id, season_number):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}/season/{season_number}?api_key={api_key}"
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get("episodes", [])
    except requests.exceptions.RequestException as e:
        messagebox.showerror("Error", f"Failed to fetch season {season_number} details:\n{e}")
        return []

def fetch_tv_certification(api_key, tv_id):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}/content_ratings?api_key={api_key}"
    try:
        response = session.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        for entry in response.json().get("results", []):
            if entry.get("iso_3166_1") == "US":
                return entry.get("rating", "N/A")
    except requests.exceptions.RequestException:
        pass
    return "N/A"

def get_existing_entry(tv_id):
    try:
        with open("tv_series.csv", mode="r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row.get("TV ID") == str(tv_id):
                    return row
    except FileNotFoundError:
        pass
    return None

def update_csv_row(tv_id, updated_row):
    rows = []
    fieldnames = None
    try:
        with open("tv_series.csv", mode="r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            fieldnames = reader.fieldnames
            for row in reader:
                if row.get("TV ID") == str(tv_id):
                    rows.append(updated_row)
                else:
                    rows.append(row)
    except FileNotFoundError:
        return
    with open("tv_series.csv", mode="w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def append_to_csv(tv_details):
    fieldnames = list(tv_details.keys())
    with open("tv_series.csv", mode="a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        if file.tell() == 0:
            writer.writeheader()
        writer.writerow(tv_details)
    messagebox.showinfo("Success", "TV series details saved to CSV file")

def set_loading(state):
    if state:
        status_label.config(text="Loading...")
        for btn in [search_button, next_page_button, prev_page_button]:
            btn.config(state="disabled")
    else:
        status_label.config(text="")
        for btn in [search_button, next_page_button, prev_page_button]:
            btn.config(state="normal")

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

    vars_ = {}
    select_all_var = tk.BooleanVar()

    def toggle_select_all():
        state = select_all_var.get()
        for sn, (var, ep_count, is_saved) in vars_.items():
            if not is_saved:
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
        var = tk.BooleanVar()

        if sn in already_saved:
            var.set(True)
            tk.Checkbutton(
                popup,
                text=f"Season {sn}  ({ep_count} eps)  [saved]",
                variable=var,
                state="disabled",
                anchor="w",
                fg="gray",
                font=FONT
            ).pack(fill="x", padx=12)
        else:
            tk.Checkbutton(
                popup,
                text=f"Season {sn}  ({ep_count} episodes)",
                variable=var,
                anchor="w",
                font=FONT
            ).pack(fill="x", padx=12)

        vars_[sn] = (var, ep_count, sn in already_saved)

    def on_confirm_click():
        selected = {
            sn: ep_count
            for sn, (var, ep_count, is_saved) in vars_.items()
            if var.get() and not is_saved
        }
        popup.destroy()
        on_confirm(selected)

    tk.Button(
        popup,
        text="Confirm",
        command=on_confirm_click,
        font=FONT
    ).pack(pady=12)

def fetch_and_display_tv(tv_name):
    global current_page, total_pages
    set_loading(True)
    response = search_tv(api_key, tv_name, current_page)
    tv_series = response.get("results", [])
    total_pages = response.get("total_pages", 1)

    if not tv_series:
        messagebox.showinfo("No Results", "No TV series found for the given name")
        set_loading(False)
        return

    for widget in table_frame.winfo_children():
        widget.destroy()

    columns = ("TV ID", "Name", "Language", "Seasons", "Episode Runtime", "First Air Year")
    tree = ttk.Treeview(table_frame, columns=columns, show="headings")

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

    for col in columns:
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
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = {
                executor.submit(fetch_tv_details, api_key, tid): (tid, iid)
                for tid, iid in item_map.items()
            }
            for future in as_completed(futures):
                tid, iid = futures[future]
                details = future.result()
                seasons = details.get("number_of_seasons", "N/A")
                run_times = details.get("episode_run_time", [])
                runtime = run_times[0] if run_times else "N/A"
                root.after(0, lambda i=iid, s=seasons, r=runtime: (
                    tree.set(i, "Seasons", s),
                    tree.set(i, "Episode Runtime", r)
                ))
        root.after(0, lambda: set_loading(False))

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

            details = fetch_tv_details(api_key, tv_id)
            credits = fetch_tv_credits(api_key, tv_id)
            keywords = fetch_tv_keywords(api_key, tv_id)
            certification = fetch_tv_certification(api_key, tv_id)

            genres = ", ".join([g["name"] for g in details.get("genres", [])])
            creators = ", ".join([c["name"] for c in details.get("created_by", [])])
            networks = ", ".join([n["name"] for n in details.get("networks", [])])
            cast = ", ".join([m["name"] for m in credits.get("cast", [])[:5]])
            keywords_list = ", ".join([k["name"] for k in keywords])
            poster_path = details.get("poster_path", "")
            poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}" if poster_path else "N/A"
            seasons = details.get("seasons", [])

            existing = get_existing_entry(tv_id)
            if existing:
                saved_str = existing.get("Seasons Watched", "")
                already_saved = {int(s) for s in saved_str.split(",") if s.strip().isdigit()}
            else:
                already_saved = set()

            def do_save(selected_seasons, tv_id=tv_id, values=values, details=details,
                        genres=genres, creators=creators, networks=networks,
                        cast=cast, keywords_list=keywords_list, existing=existing,
                        already_saved=already_saved, certification=certification,
                        poster_url=poster_url):
                if not selected_seasons:
                    messagebox.showinfo("No Selection", "No new seasons were selected.")
                    return

                episodes_watched = 0
                total_runtime_min = 0
                for sn in selected_seasons:
                    episodes = fetch_season_details(api_key, tv_id, sn)
                    episodes_watched += len(episodes)
                    total_runtime_min += sum(ep.get("runtime") or 0 for ep in episodes)

                new_saved = already_saved | set(selected_seasons.keys())
                seasons_watched_str = ",".join(str(s) for s in sorted(new_saved))

                if existing:
                    prev_episodes = int(existing.get("Episodes Watched") or 0)
                    prev_runtime = int(existing.get("Total Runtime Watched (min)") or 0)
                    updated_row = dict(existing)
                    updated_row["Episodes Watched"] = prev_episodes + episodes_watched
                    updated_row["Total Runtime Watched (min)"] = prev_runtime + total_runtime_min
                    updated_row["Seasons Watched"] = seasons_watched_str
                    update_csv_row(tv_id, updated_row)
                    added = sorted(selected_seasons.keys())
                    messagebox.showinfo("Updated", f"Season(s) {added} added. CSV updated.")
                else:
                    tv_details = {
                        "TV ID": tv_id,
                        "Name": values[1],
                        "Language": values[2],
                        "Seasons": values[3],
                        "Episode Runtime": values[4],
                        "First Air Year": values[5],
                        "Genres": genres,
                        "Creators": creators,
                        "Networks": networks,
                        "Status": details.get("status", "N/A"),
                        "Total Episodes": details.get("number_of_episodes", "N/A"),
                        "Last Episode Air Date": details.get("last_air_date", "N/A"),
                        "Popularity": details.get("popularity", "N/A"),
                        "Vote Count": details.get("vote_count", "N/A"),
                        "Vote Average": details.get("vote_average", "N/A"),
                        "Actors/Actresses": cast,
                        "Keywords/Tags": keywords_list,
                        "First Air Date": details.get("first_air_date", "N/A"),
                        "Overview": details.get("overview", "N/A"),
                        "Tagline": details.get("tagline", "N/A"),
                        "Poster URL": poster_url,
                        "Age Rating": certification,
                        "Seasons Watched": seasons_watched_str,
                        "Episodes Watched": episodes_watched,
                        "Total Runtime Watched (min)": total_runtime_min
                    }
                    append_to_csv(tv_details)

            show_season_panel(seasons, already_saved, do_save)

    tree.pack(fill=tk.BOTH, expand=True)
    save_button.config(command=save_selected_to_csv)

def on_search_click():
    global current_page
    tv_name = entry.get()
    if not tv_name:
        messagebox.showwarning("Input Required", "Please enter a TV series name")
        return
    current_page = 1
    fetch_and_display_tv(tv_name)

def on_next_page_click():
    global current_page, total_pages
    if current_page < total_pages:
        current_page += 1
        fetch_and_display_tv(entry.get())
    else:
        messagebox.showinfo("End of Results", "No more pages available.")

def on_prev_page_click():
    global current_page
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

FONT = ("TkDefaultFont", 12)
FONT_BOLD = ("TkDefaultFont", 12, "bold")

style = ttk.Style()
style.configure("Treeview", font=("TkDefaultFont", 11), rowheight=28)
style.configure("Treeview.Heading", font=("TkDefaultFont", 11, "bold"))

entry_label = tk.Label(root, text="Enter TV Series Name:", font=FONT)
entry_label.pack(pady=(10, 2))
entry = tk.Entry(root, width=45, font=("TkDefaultFont", 13))
entry.pack(ipady=5)
entry.bind("<Return>", lambda e: on_search_click())

search_button = tk.Button(root, text="Search", command=on_search_click, font=FONT)
search_button.pack(pady=(6, 2))

status_label = tk.Label(root, text="", fg="gray", font=FONT)
status_label.pack()

# Content area: table on the left, season panel on the right
content_frame = tk.Frame(root)
content_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=(4, 0))

table_frame = tk.Frame(content_frame)
table_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)


save_button = tk.Button(root, text="Save to CSV", state="normal", font=FONT)
save_button.pack(pady=4)

nav_frame = tk.Frame(root)
nav_frame.pack(pady=(0, 8))
prev_page_button = tk.Button(nav_frame, text="Previous Page", command=on_prev_page_click, font=FONT)
prev_page_button.pack(side=tk.LEFT, padx=8)
next_page_button = tk.Button(nav_frame, text="Next Page", command=on_next_page_click, font=FONT)
next_page_button.pack(side=tk.LEFT, padx=8)

root.mainloop()
