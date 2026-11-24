"""TMDB -> public/tv_series.csv generator (Tkinter).

    TMDB_API_KEY=... python series-search.py

Search TMDB, pick a show, tick the seasons you've watched; the row lands in the CSV the dashboard
reads. Importable without side effects (`main()` only runs as a script) — `scripts/test_series_search.py`
drives `App` with a fake HTTP layer and a temp CSV.

Threading rule: every network call runs in a worker thread; workers never touch Tk. Results come
back through `App._results` (a queue the Tk loop polls), so the window never freezes and all
widgets/dialogs stay on the main thread.
"""
import csv
import os
import queue
import re
import tempfile
import threading
import traceback
import tkinter as tk
from concurrent.futures import ThreadPoolExecutor, as_completed
from tkinter import messagebox, ttk

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

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
PLACEHOLDER = "—"  # table cell still loading / unknown (display only, never written to the CSV)

FONT_FAMILY = "TkDefaultFont"
FONT = (FONT_FAMILY, 12)
FONT_BOLD = (FONT_FAMILY, 12, "bold")


# ---------------------------------------------------------------------------------------------
# TMDB
# ---------------------------------------------------------------------------------------------

class TmdbError(Exception):
    """A TMDB request failed. The message is safe to show: the API key is redacted."""


def redact(text, secret):
    """Strip the API key from error text — requests' messages include the full request URL."""
    text = re.sub(r"(api_key=)[^&\s'\"]+", r"\1***", text)
    return text.replace(secret, "***") if secret else text


class TmdbClient:
    """HTTP layer. Called from worker threads only (it blocks)."""

    def __init__(self, api_key, session=None):
        """`session`: anything with requests.Session's get() — tests pass a fake."""
        self.api_key = api_key
        if session is None:
            session = requests.Session()
            retry = Retry(total=3, status_forcelist=[429, 500, 502, 503, 504], allowed_methods=["GET"], backoff_factor=2)
            session.mount("https://", HTTPAdapter(max_retries=retry))
            session.headers.update({"User-Agent": "Mozilla/5.0"})
        self.session = session
        # Successful detail responses by TV ID. One request carries credits, keywords and US rating
        # (append_to_response); the save path reuses what the search table already fetched.
        self._details = {}

    def get(self, path, **params):
        """Every failure leaves as TmdbError with the key redacted — the one place that rule lives."""
        try:
            # requests URL-encodes params (e.g. a '&' in a search term)
            response = self.session.get(f"{BASE_URL}{path}", params={"api_key": self.api_key, **params}, timeout=10)
            response.raise_for_status()
            return response.json()
        except (requests.exceptions.RequestException, ValueError) as e:  # ValueError: non-JSON body
            # `from None`: the chained exception's traceback would print the URL (with the key)
            raise TmdbError(redact(str(e), self.api_key)) from None

    def search(self, name, page):
        data = self.get("/search/tv", query=name, page=page)
        return data.get("results", []), data.get("total_pages", 1)

    def details(self, tv_id):
        key = str(tv_id)
        if key not in self._details:
            self._details[key] = self.get(f"/tv/{tv_id}", append_to_response="credits,keywords,content_ratings")
        return self._details[key]

    def season_episodes(self, tv_id, season_number):
        return self.get(f"/tv/{tv_id}/season/{season_number}").get("episodes", [])


# ---------------------------------------------------------------------------------------------
# CSV
# ---------------------------------------------------------------------------------------------

def names(items, limit=None):
    return ", ".join(item["name"] for item in items[:limit])


def us_certification(details):
    for entry in details.get("content_ratings", {}).get("results", []):
        if entry.get("iso_3166_1") == "US":
            return entry.get("rating") or ""
    return ""


def first_runtime(details):
    """First listed episode runtime (minutes), or None."""
    run_times = details.get("episode_run_time") or []
    return run_times[0] if run_times else None


def air_year(item):
    """Year of first_air_date ('2010-01-01' -> '2010'), or '' — search results and details alike."""
    return (item.get("first_air_date") or "").split("-")[0]


# Unknown values are written as '' (not 'N/A') — the dashboard reads blank as unknown
def field(details, key):
    value = details.get(key)
    return "" if value is None else value


def new_row(tv_id, details):
    """CSV row for a show not yet in the file (watch-progress columns filled in by the caller)."""
    runtime = first_runtime(details)
    poster_path = details.get("poster_path")
    return {
        "TV ID": tv_id,
        "Name": field(details, "name"),
        "Language": field(details, "original_language"),
        "Seasons": field(details, "number_of_seasons"),
        "Episode Runtime": "" if runtime is None else runtime,
        "First Air Year": air_year(details),
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


def saved_seasons(row):
    """Season numbers already recorded in a CSV row (None → empty)."""
    raw = (row or {}).get("Seasons Watched", "")
    return {int(s) for s in raw.split(",") if s.strip().isdigit()}


class CsvStore:
    """The dashboard CSV. Main thread only (small file, fast I/O)."""

    def __init__(self, path=CSV_PATH):
        self.path = path

    def load(self):
        """(fieldnames, rows) of the existing CSV, or (None, []) if there is none.
        utf-8-sig: a file re-saved by Excel ("CSV UTF-8") starts with a BOM, which would otherwise
        turn the first header into '\ufeffTV ID' — every lookup would miss and saves would duplicate rows."""
        try:
            with open(self.path, mode="r", encoding="utf-8-sig") as file:
                reader = csv.DictReader(file)
                return reader.fieldnames, list(reader)
        except FileNotFoundError:
            return None, []

    def get(self, tv_id):
        _, rows = self.load()
        return next((row for row in rows if row.get("TV ID") == str(tv_id)), None)

    def update(self, tv_id, updated_row):
        fieldnames, rows = self.load()
        if fieldnames is None:
            return
        rows = [updated_row if row.get("TV ID") == str(tv_id) else row for row in rows]
        # Write a temp file in the same directory, then swap it in: a failure mid-write (disk, a bad
        # row, the file locked by Excel) leaves the original CSV untouched instead of truncated.
        # extrasaction="ignore": a hand-edited row with too many fields comes back from DictReader with
        # a None key — dropped here (the dashboard skips that row anyway) rather than aborting the write.
        directory = os.path.dirname(self.path) or "."
        fd, tmp_path = tempfile.mkstemp(dir=directory, prefix=".tv_series-", suffix=".csv.tmp")
        try:
            with os.fdopen(fd, mode="w", newline="", encoding="utf-8") as file:
                writer = csv.DictWriter(file, fieldnames=fieldnames, restval="", extrasaction="ignore")
                writer.writeheader()
                writer.writerows(rows)
            os.replace(tmp_path, self.path)
        except BaseException:
            try:
                os.remove(tmp_path)
            except OSError:
                pass
            raise

    def append(self, row):
        """Append a row; returns FIELDNAMES columns the existing file lacks (their values are dropped).
        Follows the existing file's header (an older or hand-edited file may differ from FIELDNAMES)
        so values land under the right columns; FIELDNAMES only for a new file."""
        header, _ = self.load()
        if not header:
            os.makedirs(os.path.dirname(self.path), exist_ok=True)
        with open(self.path, mode="a", newline="", encoding="utf-8") as file:
            writer = csv.DictWriter(file, fieldnames=header or FIELDNAMES, restval="", extrasaction="ignore")
            if not header:
                writer.writeheader()
            writer.writerow(row)
        return [c for c in FIELDNAMES if c not in header] if header else []


# ---------------------------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------------------------

class App:
    POLL_MS = 30

    def __init__(self, root, client, store, dialogs=messagebox):
        """`dialogs`: anything with messagebox's showinfo / showwarning / showerror — tests record them."""
        self.root = root
        self.client = client
        self.store = store
        self.dialogs = dialogs
        self.query = ""         # last search that returned results — Next/Prev page through it
        self.current_page = 1   # page shown in the table (changed only after a successful fetch)
        self.total_pages = 1
        self.loading = False    # search + details load running — search/paging ignored until it ends
        self.saving = 0         # background save steps in flight — Save disabled meanwhile
        self.tree = None
        self._results = queue.Queue()
        self._pending = 0  # run_bg jobs whose on_done hasn't run yet (main thread only)
        self._polling = False
        self._build_ui()

    # --- worker plumbing -------------------------------------------------------------------

    def run_bg(self, work, on_done):
        """Run work() in a worker thread; on_done(result or exception) later on the main thread."""
        def target():
            try:
                result = work()
            except Exception as e:  # handed to on_done; never raised in the worker
                result = e
            self._results.put((finish, result))

        def finish(result):
            self._pending -= 1
            on_done(result)

        self._pending += 1
        threading.Thread(target=target, daemon=True).start()
        if not self._polling:  # polled only while work is in flight — no timer while idle
            self._polling = True
            self.root.after(self.POLL_MS, self._poll)

    def post(self, callback, *args):
        """From a worker inside a run_bg job: run callback(*args) on the main thread, in order.
        Only valid while that job is pending — that's what keeps the poll loop running."""
        self._results.put((lambda _: callback(*args), None))

    def _poll(self):
        try:
            while True:
                callback, result = self._results.get_nowait()
                try:
                    callback(result)
                except Exception as e:
                    # One bad callback must not stop the poll loop — and the user must hear about it
                    # (e.g. PermissionError: the CSV is open in Excel), not just a console traceback.
                    traceback.print_exc()
                    self._recover_from_error()
                    self.dialogs.showerror("Error", f"Something went wrong:\n{type(e).__name__}: {e}")
        except queue.Empty:
            pass
        if self._pending:
            self.root.after(self.POLL_MS, self._poll)
        else:
            self._polling = False

    def _recover_from_error(self):
        """After a failed callback: re-enable the UI unless other work is still in flight."""
        if not self._pending:
            self.loading = False
            self.saving = 0
            self._refresh_status()

    # --- UI ---------------------------------------------------------------------------------

    def _build_ui(self):
        root = self.root
        root.title("TMDB TV Series Search")
        root.geometry("1100x660")
        root.minsize(800, 500)

        style = ttk.Style(root)
        style.configure("Treeview", font=(FONT_FAMILY, 11), rowheight=28)
        style.configure("Treeview.Heading", font=(FONT_FAMILY, 11, "bold"))

        tk.Label(root, text="Enter TV Series Name:", font=FONT).pack(pady=(10, 2))
        self.entry = tk.Entry(root, width=45, font=(FONT_FAMILY, 13))
        self.entry.pack(ipady=5)
        self.entry.bind("<Return>", lambda e: self.on_search_click())

        self.search_button = tk.Button(root, text="Search", command=self.on_search_click, font=FONT)
        self.search_button.pack(pady=(6, 2))

        self.status_label = tk.Label(root, text="", fg="gray", font=FONT)
        self.status_label.pack()

        self.table_frame = tk.Frame(root)
        self.table_frame.pack(fill=tk.BOTH, expand=True, padx=8, pady=(4, 0))

        self.save_button = tk.Button(root, text="Save to CSV", command=self.on_save_click, font=FONT)
        self.save_button.pack(pady=4)

        nav_frame = tk.Frame(root)
        nav_frame.pack(pady=(0, 8))
        self.prev_page_button = tk.Button(nav_frame, text="Previous Page", command=self.on_prev_page_click, font=FONT)
        self.prev_page_button.pack(side=tk.LEFT, padx=8)
        self.next_page_button = tk.Button(nav_frame, text="Next Page", command=self.on_next_page_click, font=FONT)
        self.next_page_button.pack(side=tk.LEFT, padx=8)

    def _refresh_status(self):
        self.status_label.config(text="Loading..." if self.loading else "Saving..." if self.saving else "")
        for btn in [self.search_button, self.next_page_button, self.prev_page_button]:
            btn.config(state="disabled" if self.loading else "normal")
        self.save_button.config(state="disabled" if self.saving else "normal")

    def set_loading(self, state):
        self.loading = state
        self._refresh_status()

    def _change_saving(self, delta):
        self.saving += delta
        self._refresh_status()

    # --- search / paging --------------------------------------------------------------------
    # Handlers check `loading` first: a search started mid-load would race the running one for
    # the table. The page counter only moves once a fetch succeeds, so it always matches the table.

    def on_search_click(self):
        if self.loading:
            return
        name = self.entry.get().strip()
        if not name:
            self.dialogs.showwarning("Input Required", "Please enter a TV series name")
            return
        self.load_page(name, 1)

    def on_next_page_click(self):
        if self.loading:
            return
        if self.query and self.current_page < self.total_pages:
            self.load_page(self.query, self.current_page + 1)
        else:
            self.dialogs.showinfo("End of Results", "No more pages available.")

    def on_prev_page_click(self):
        if self.loading:
            return
        if self.query and self.current_page > 1:
            self.load_page(self.query, self.current_page - 1)
        else:
            self.dialogs.showinfo("Start of Results", "You are on the first page.")

    def load_page(self, name, page):
        self.set_loading(True)

        def done(result):
            if isinstance(result, Exception):
                self.set_loading(False)
                self.dialogs.showerror("Connection Error", f"Failed to fetch data from TMDB:\n{result}")
                return
            results, total_pages = result
            if not results:
                self.set_loading(False)
                self.dialogs.showinfo("No Results", "No TV series found for the given name")
                return
            self.query, self.current_page, self.total_pages = name, page, total_pages
            self._show_results(results)

        self.run_bg(lambda: self.client.search(name, page), done)

    def _show_results(self, results):
        for widget in self.table_frame.winfo_children():
            widget.destroy()
        tree = ttk.Treeview(self.table_frame, columns=TABLE_COLUMNS, show="headings")
        self.tree = tree
        sort_reverse = {}

        def sort_column(col):
            rows = [(tree.set(iid, col), iid) for iid in tree.get_children("")]
            try:
                rows.sort(key=lambda x: float(x[0].replace(PLACEHOLDER, "0")), reverse=sort_reverse.get(col, False))
            except ValueError:
                rows.sort(key=lambda x: x[0].lower(), reverse=sort_reverse.get(col, False))
            for i, (_, iid) in enumerate(rows):
                tree.move(iid, "", i)
            sort_reverse[col] = not sort_reverse.get(col, False)

        for col in TABLE_COLUMNS:
            tree.heading(col, text=col, command=lambda c=col: sort_column(c))
            tree.column(col, width=150, anchor="center")

        item_map = {}
        for tv in results:
            tv_id = tv.get("id")
            if tv_id is None:
                continue
            year = air_year(tv) or PLACEHOLDER
            item_map[str(tv_id)] = tree.insert("", "end", values=(
                tv_id, tv.get("name") or PLACEHOLDER, tv.get("original_language") or PLACEHOLDER,
                PLACEHOLDER, PLACEHOLDER, year,
            ))
        tree.pack(fill=tk.BOTH, expand=True)

        def fill_row(iid, details):
            if tree.winfo_exists() and tree.exists(iid):
                runtime = first_runtime(details)
                tree.set(iid, "Seasons", details.get("number_of_seasons") or PLACEHOLDER)
                tree.set(iid, "Episode Runtime", PLACEHOLDER if runtime is None else runtime)

        def fetch_all_details():  # worker: rows filled via post(), failures counted
            failed = 0
            with ThreadPoolExecutor(max_workers=6) as executor:
                futures = {executor.submit(self.client.details, tid): iid for tid, iid in item_map.items()}
                for future in as_completed(futures):
                    try:
                        details = future.result()
                    except Exception:
                        failed += 1
                        continue
                    self.post(fill_row, futures[future], details)
            return failed

        def done(failed):
            self.set_loading(False)
            if isinstance(failed, Exception):
                self.dialogs.showerror("Error", f"Failed to fetch show details:\n{failed}")
            elif failed:
                self.dialogs.showerror("Error", f"Failed to fetch details for {failed} show(s). They are fetched again on save.")

        self.run_bg(fetch_all_details, done)

    # --- save -------------------------------------------------------------------------------

    def on_save_click(self):
        if self.saving:
            return
        if not self.tree:
            self.dialogs.showwarning("Selection Required", "Please select a TV series from the list")
            return
        children = self.tree.get_children()
        selected = children if len(children) == 1 else self.tree.selection()
        if not selected:
            self.dialogs.showwarning("Selection Required", "Please select a TV series from the list")
            return
        for item in selected:
            self._begin_save(str(self.tree.item(item, "values")[0]))

    def _begin_save(self, tv_id):
        self._change_saving(+1)

        def done(details):  # cached from the table fetch when it succeeded
            self._change_saving(-1)
            if isinstance(details, Exception):
                self.dialogs.showerror("Error", f"Failed to fetch details:\n{details}")
                return
            self.show_season_panel(
                details.get("seasons", []),
                saved_seasons(self.store.get(tv_id)),
                lambda selected: self._save_seasons(tv_id, details, selected),
            )

        self.run_bg(lambda: self.client.details(tv_id), done)

    def _save_seasons(self, tv_id, details, selected_seasons):
        if not selected_seasons:
            self.dialogs.showinfo("No Selection", "No new seasons were selected.")
            return
        self._change_saving(+1)

        def fetch_seasons():  # worker, parallel; a failed season is skipped, never recorded as 0 episodes
            episodes, errors = {}, {}
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = {executor.submit(self.client.season_episodes, tv_id, sn): sn for sn in selected_seasons}
                for future in as_completed(futures):
                    sn = futures[future]
                    try:
                        episodes[sn] = future.result()
                    except TmdbError as e:
                        errors[sn] = str(e)
            return episodes, errors

        def done(result):
            self._change_saving(-1)
            if isinstance(result, Exception):
                self.dialogs.showerror("Error", f"Saving failed:\n{result}")
                return
            episodes, errors = result
            failed = sorted(errors)
            reason = f"\n\n{errors[failed[0]]}" if failed else ""
            if not episodes:
                self.dialogs.showwarning("Not Saved", f"Could not fetch season(s) {failed}. Nothing was saved.{reason}")
                return
            fail_note = f"\nSeason(s) {failed} failed to fetch and were not saved.{reason}" if failed else ""
            # Re-read: the file may have changed while fetching (another panel saved the same season,
            # a hand edit). Count only seasons the row doesn't have yet, or episodes double up.
            existing = self.store.get(tv_id)
            already = saved_seasons(existing)
            fetched = sorted(sn for sn in episodes if sn not in already)
            if not fetched:
                self.dialogs.showinfo("Already Saved", f"Season(s) {sorted(episodes)} are already in the CSV. Nothing changed.{fail_note}")
                return
            episodes_watched = sum(len(episodes[sn]) for sn in fetched)
            runtime_min = sum(ep.get("runtime") or 0 for sn in fetched for ep in episodes[sn])
            seasons_watched = ",".join(str(s) for s in sorted(already | set(fetched)))
            if existing:
                updated = dict(existing)
                updated["Episodes Watched"] = int(existing.get("Episodes Watched") or 0) + episodes_watched
                updated["Total Runtime Watched (min)"] = int(existing.get("Total Runtime Watched (min)") or 0) + runtime_min
                updated["Seasons Watched"] = seasons_watched
                self.store.update(tv_id, updated)
                self.dialogs.showinfo("Updated", f"Season(s) {fetched} added. CSV updated.{fail_note}")
                return
            # From the full details, not the table cells (those may still show the placeholder)
            missing = self.store.append({
                **new_row(tv_id, details),
                "Seasons Watched": seasons_watched,
                "Episodes Watched": episodes_watched,
                "Total Runtime Watched (min)": runtime_min,
            })
            if missing:
                self.dialogs.showwarning("CSV Columns", "tv_series.csv has no column for: " + ", ".join(missing)
                                       + "\nThose values are not saved for this show.")
            if failed:
                self.dialogs.showwarning("Partly Saved", f"TV series saved to CSV file.{fail_note}")
            else:
                self.dialogs.showinfo("Success", "TV series details saved to CSV file")

        self.run_bg(fetch_seasons, done)

    def show_season_panel(self, seasons, already_saved, on_confirm):
        real_seasons = [s for s in seasons if s.get("season_number", 0) != 0]
        if all(s["season_number"] in already_saved for s in real_seasons):
            self.dialogs.showinfo("All Seasons Saved", "All seasons for this series are already saved.")
            return

        popup = tk.Toplevel(self.root)
        popup.title("Select Seasons Watched")
        popup.resizable(False, False)
        popup.grab_set()

        tk.Label(popup, text="Seasons Watched", font=FONT_BOLD).pack(pady=(10, 4))
        ttk.Separator(popup, orient="horizontal").pack(fill="x", padx=6, pady=(0, 6))

        vars_ = {}       # new (selectable) seasons only: sn -> var
        saved_vars = []  # disabled, pre-checked vars for saved seasons
        select_all_var = tk.BooleanVar(master=popup)

        def toggle_select_all():
            for var in vars_.values():
                var.set(select_all_var.get())

        tk.Checkbutton(popup, text="Select All", variable=select_all_var, command=toggle_select_all,
                       anchor="w", font=FONT_BOLD).pack(fill="x", padx=10, pady=(0, 4))
        ttk.Separator(popup, orient="horizontal").pack(fill="x", padx=6, pady=(0, 4))

        for season in real_seasons:
            sn = season["season_number"]
            ep_count = season.get("episode_count", 0)
            saved = sn in already_saved
            var = tk.BooleanVar(master=popup, value=saved)
            tk.Checkbutton(
                popup,
                text=f"Season {sn}  ({ep_count} eps)  [saved]" if saved else f"Season {sn}  ({ep_count} episodes)",
                variable=var,
                anchor="w",
                font=FONT,
                **({"state": "disabled", "fg": "gray"} if saved else {}),
            ).pack(fill="x", padx=12)
            if saved:
                saved_vars.append(var)
            else:
                vars_[sn] = var
        popup.saved_vars = saved_vars  # outlive this method — a freed BooleanVar unchecks its box

        def on_confirm_click():
            selected = [sn for sn, var in vars_.items() if var.get()]
            popup.destroy()
            on_confirm(selected)

        tk.Button(popup, text="Confirm", command=on_confirm_click, font=FONT).pack(pady=12)


def main():
    api_key = os.environ.get("TMDB_API_KEY")  # never hardcode — it must not land in git history
    if not api_key:
        raise SystemExit("Set TMDB_API_KEY environment variable before running.")
    root = tk.Tk()
    App(root, TmdbClient(api_key), CsvStore())
    root.mainloop()


if __name__ == "__main__":
    main()
