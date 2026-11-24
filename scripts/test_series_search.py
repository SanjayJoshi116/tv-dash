"""End-to-end check of series-search.py, driven through its real Tk widgets with TMDB faked.

    npm run test:gen        (= python -I scripts/test_series_search.py)

Imports `App` / `TmdbClient` / `CsvStore` from series-search.py and builds them with fakes passed
in (a fake HTTP session, a dialog recorder, a temp CSV) — no global monkeypatching. The real CSV
and any real TMDB_API_KEY are never touched, and no network request is made. Needs a display (a Tk window opens briefly); Linux CI would need
xvfb-run. Exit code 1 if any check fails.

The scenario runs as a generator stepped from inside `mainloop` (the app's worker results arrive
through its polled queue): `yield None` = one tick, `yield <callable>` = wait (8s) until it's true.
"""
import importlib.util
import os
import shutil
import sys
import tempfile
import threading
import time
import tkinter as tk
import traceback

import requests

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = "dummy-test-key"

spec = importlib.util.spec_from_file_location("series_search", os.path.join(REPO, "series-search.py"))
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)  # import only — main() is guarded by __name__

TMP = tempfile.mkdtemp(prefix="series-search-test-")
CSV = os.path.join(TMP, "public", "tv_series.csv")

# --- fakes -------------------------------------------------------------------------------------

dialogs = []  # (kind, title, message)


class DialogRecorder:
    """Stands in for tkinter.messagebox (App's `dialogs` parameter)."""

    def showinfo(self, title, msg, **k):
        dialogs.append(("showinfo", title, msg))

    def showwarning(self, title, msg, **k):
        dialogs.append(("showwarning", title, msg))

    def showerror(self, title, msg, **k):
        dialogs.append(("showerror", title, msg))


calls = []
gates = {}            # "search:<page>" | "details:<page>" | "season" -> Event the request waits on
fail_search = set()   # pages whose search request fails
fail_seasons = set()  # (tv_id, season) whose fetch fails


class Resp:
    def __init__(self, url, data, status=200):
        self.url, self.data, self.status = url, data, status

    def raise_for_status(self):
        if self.status >= 400:  # real requests puts the full URL (incl. api_key) in this message
            raise requests.HTTPError(f"{self.status} Server Error: Internal Server Error for url: {self.url}")

    def json(self):
        return self.data


def page_of(tid):
    return (tid - 1000) // 10


def wait_gate(name):
    ev = gates.get(name)
    if ev:
        ev.wait(10)


class FakeSession:
    """Stands in for requests.Session (TmdbClient's `session` parameter)."""

    def get(self, url, params=None, timeout=None, **k):
        return fake_get(url, dict(params or {}))


def fake_get(url, params):
    full = f"{url}?api_key={params.get('api_key')}"  # like requests' error text: full URL incl. key
    path = url.split("/3", 1)[1]
    calls.append((path, params, threading.current_thread() is threading.main_thread()))
    if path == "/search/tv":
        p = params["page"]
        wait_gate(f"search:{p}")
        if p in fail_search:
            return Resp(full, None, 500)
        return Resp(full, {"results": [{"id": 1000 + p * 10 + i, "name": f"Show p{p}-{i}", "original_language": "en",
                                        "first_air_date": "2010-01-01"} for i in range(3)], "total_pages": 3})
    parts = path.strip("/").split("/")
    tid = int(parts[1])
    if len(parts) == 2:
        wait_gate(f"details:{page_of(tid)}")
        return Resp(full, {"id": tid, "name": f"Show {tid}", "original_language": "en", "number_of_seasons": 3,
                           "episode_run_time": [45], "first_air_date": "2010-01-01", "genres": [{"name": "Drama"}],
                           "created_by": [], "networks": [{"name": "Net"}], "status": "Ended", "number_of_episodes": 24,
                           "seasons": [{"season_number": 0, "episode_count": 2}, {"season_number": 1, "episode_count": 10},
                                       {"season_number": 2, "episode_count": 8}, {"season_number": 3, "episode_count": 6}],
                           "credits": {"cast": []}, "keywords": {"results": []}, "content_ratings": {"results": []}})
    sn = int(parts[3])
    wait_gate("season")
    if (tid, sn) in fail_seasons:
        return Resp(full, None, 500)
    return Resp(full, {"episodes": [{"runtime": 45}] * {1: 10, 2: 8, 3: 6}[sn]})


root = tk.Tk()
app = gen.App(root, gen.TmdbClient(KEY, session=FakeSession()), gen.CsvStore(CSV), dialogs=DialogRecorder())

# --- helpers -----------------------------------------------------------------------------------

results = []


def check(name, cond, info=""):
    results.append((name, bool(cond)))
    print(("PASS " if cond else "FAIL ") + name + (f"  [{info}]" if not cond else ""))


def rows():
    return [app.tree.item(i, "values") for i in app.tree.get_children()] if app.tree else []


def cell(r, c):
    return str(rows()[r][c])


def searches():
    return [c for c in calls if c[0] == "/search/tv"]


def row(tid):
    """All CSV rows with this TV ID (a list, so a duplicate row would show up)."""
    return [x for x in app.store.load()[1] if x["TV ID"] == str(tid)]


def season_popup():
    tops = [w for w in root.winfo_children() if isinstance(w, tk.Toplevel) and w.winfo_exists()]
    return tops[-1] if tops else None


def select_row(tid):
    app.tree.selection_set(next(i for i in app.tree.get_children() if str(app.tree.item(i, "values")[0]) == str(tid)))


def click(pop, text):
    """Invoke the popup widget (Button / Checkbutton) whose label starts with `text`."""
    next(w for w in pop.winfo_children() if isinstance(w, (tk.Button, tk.Checkbutton)) and w.cget("text").startswith(text)).invoke()


def save_show(tid, pick, out):
    """Select row tid, click Save, tick seasons in `pick`, Confirm, wait for the save to finish.
    out["seen"] = {season: (checked, disabled)} as shown in the panel, or None if no panel opened."""
    select_row(tid)
    yield None
    n_dialogs = len(dialogs)
    app.save_button.invoke()
    yield lambda: season_popup() is not None or (app.saving == 0 and len(dialogs) > n_dialogs)
    pop = season_popup()
    out.clear()
    if pop is None:
        out["seen"] = None
        return
    seen = {}
    for cb in [w for w in pop.winfo_children() if isinstance(w, tk.Checkbutton)]:
        text = cb.cget("text")
        if not text.startswith("Season "):
            continue
        sn = int(text.split()[1])
        disabled = str(cb.cget("state")) == "disabled"
        seen[sn] = (bool(int(root.getvar(cb.cget("variable")))), disabled)
        if sn in pick and not disabled:
            cb.invoke()
    click(pop, "Confirm")
    yield None
    yield lambda: app.saving == 0
    out["seen"] = seen


# --- scenario ----------------------------------------------------------------------------------

def scenario():
    yield None

    # A: search via Enter; search runs off the main thread
    gates["search:1"] = threading.Event()
    app.entry.insert(0, "star")
    app.entry.focus_force()
    yield None
    t0 = time.time()
    app.entry.event_generate("<Return>")
    yield None
    yield None
    check("A search request blocked -> UI keeps running (not frozen)", time.time() - t0 < 2 and app.loading)
    check("A status shows Loading..., buttons disabled",
          app.status_label.cget("text") == "Loading..." and str(app.search_button["state"]) == "disabled")
    gates["search:1"].set()
    ok = yield lambda: not app.loading
    check("A page 1 shown", ok and app.current_page == 1 and cell(0, 1) == "Show p1-0", rows()[:1])
    ok = yield lambda: cell(0, 3) == "3" and cell(0, 4) == "45"
    check("A details fill Seasons / Runtime columns", ok, rows()[:1])
    check("A every TMDB request ran off the main thread", calls and not any(c[2] for c in calls))

    # B: Enter / Next / Prev / Search while page 2 is loading
    gates["details:2"] = threading.Event()
    app.next_page_button.invoke()
    yield lambda: app.current_page == 2
    check("B Next shows page 2, details still loading", app.loading and app.current_page == 2, (app.loading, app.current_page))
    n_search = len(searches())
    app.entry.focus_force()
    yield None
    app.entry.event_generate("<Return>")
    yield None
    app.on_next_page_click()
    app.on_prev_page_click()
    app.on_search_click()
    yield None
    check("B Enter / handlers mid-load: counter stays 2, no new search", app.current_page == 2 and len(searches()) == n_search,
          (app.current_page, len(searches()) - n_search))
    check("B buttons disabled while loading", str(app.next_page_button["state"]) == "disabled")
    check("B no dialogs mid-load", not dialogs, dialogs)
    gates["details:2"].set()
    yield lambda: not app.loading
    check("B after load: table + counter both page 2", cell(0, 1) == "Show p2-0" and app.current_page == 2)

    # B2: a failed page fetch leaves table + counter alone; error text has no API key
    fail_search.add(3)
    dialogs.clear()
    app.next_page_button.invoke()
    yield lambda: not app.loading
    err = [d for d in dialogs if d[0] == "showerror"]
    check("B2 failed Next: counter + table stay on page 2", app.current_page == 2 and cell(0, 1) == "Show p2-0",
          (app.current_page, cell(0, 1)))
    check("B2 error shown with the API key redacted", err and KEY not in err[0][2] and "api_key=***" in err[0][2], dialogs)
    fail_search.clear()

    # B3: Next pages through the last search, even if the entry text changed
    app.entry.delete(0, tk.END)
    app.entry.insert(0, "something else")
    app.next_page_button.invoke()
    yield lambda: not app.loading
    check("B3 Next after editing the entry: page 3 of the original search",
          app.current_page == 3 and cell(0, 1) == "Show p3-0" and searches()[-1][1]["query"] == "star",
          (app.current_page, searches()[-1][1]))

    # C: add a new show (seasons 1, 2)
    dialogs.clear()
    out = {}
    yield from save_show(1030, {1, 2}, out)
    r = row(1030)
    check("C panel lists seasons 1-3 unchecked (season 0 hidden)",
          out["seen"] == {1: (False, False), 2: (False, False), 3: (False, False)}, out["seen"])
    check("C row appended: seasons 1,2 / 18 eps / 810 min",
          len(r) == 1 and r[0]["Seasons Watched"] == "1,2" and r[0]["Episodes Watched"] == "18"
          and r[0]["Total Runtime Watched (min)"] == "810", r)
    check("C Seasons / Runtime from TMDB details", r and r[0]["Seasons"] == "3" and r[0]["Episode Runtime"] == "45", r)
    check("C Success dialog", any(d[1] == "Success" for d in dialogs), dialogs)

    # D: add season 3 to that existing show
    dialogs.clear()
    yield from save_show(1030, {3}, out)
    r = row(1030)
    check("D saved seasons shown checked + disabled", out["seen"] == {1: (True, True), 2: (True, True), 3: (False, False)}, out["seen"])
    check("D row updated in place: 1,2,3 / 24 eps / 1080 min",
          len(r) == 1 and r[0]["Seasons Watched"] == "1,2,3" and r[0]["Episodes Watched"] == "24"
          and r[0]["Total Runtime Watched (min)"] == "1080", r)
    check("D Updated dialog", any(d[1] == "Updated" for d in dialogs), dialogs)
    dialogs.clear()
    yield from save_show(1030, set(), out)
    check("D all seasons saved -> no panel, info dialog",
          out["seen"] is None and any(d[1] == "All Seasons Saved" for d in dialogs), dialogs)

    # E: a failed season fetch while adding a new show
    dialogs.clear()
    fail_seasons.add((1031, 2))
    yield from save_show(1031, {1, 2}, out)
    r = row(1031)
    partly = [d for d in dialogs if d[1] == "Partly Saved"]
    check("E failed season skipped, good one saved", len(r) == 1 and r[0]["Seasons Watched"] == "1" and r[0]["Episodes Watched"] == "10", r)
    check("E Partly Saved names the season + reason, key redacted",
          partly and "[2]" in partly[0][2] and "500" in partly[0][2] and KEY not in partly[0][2], dialogs)
    fail_seasons.clear()
    dialogs.clear()
    yield from save_show(1031, {2}, out)
    r = row(1031)
    check("E failed season still addable later",
          out["seen"] and out["seen"].get(2) == (False, False) and r[0]["Seasons Watched"] == "1,2" and r[0]["Episodes Watched"] == "18",
          (out["seen"], r))

    # F: every selected season fails
    dialogs.clear()
    fail_seasons.add((1031, 3))
    yield from save_show(1031, {3}, out)
    check("F existing show, all fail: Not Saved, row unchanged",
          row(1031)[0]["Seasons Watched"] == "1,2" and any(d[1] == "Not Saved" for d in dialogs), (row(1031), dialogs))
    dialogs.clear()
    fail_seasons.update({(1032, 1), (1032, 2)})
    yield from save_show(1032, {1, 2}, out)
    check("F new show, all fail: nothing written, Not Saved", not row(1032) and any(d[1] == "Not Saved" for d in dialogs), dialogs)

    # G: partial failure on an existing show
    fail_seasons.clear()
    fail_seasons.add((1032, 2))
    yield from save_show(1032, {1}, out)
    dialogs.clear()
    yield from save_show(1032, {2, 3}, out)
    r = row(1032)
    upd = [d for d in dialogs if d[1] == "Updated"]
    check("G existing show partial: good season added, message names the failed one",
          r[0]["Seasons Watched"] == "1,3" and upd and "[2] failed" in upd[0][2], (r, dialogs))

    # H: season fetches run off the main thread; Save disabled meanwhile
    fail_seasons.clear()
    gates["season"] = threading.Event()
    select_row(1031)
    app.save_button.invoke()
    yield lambda: season_popup() is not None
    pop = season_popup()
    click(pop, "Season 3")
    t0 = time.time()
    click(pop, "Confirm")
    yield None
    yield None
    check("H season fetch blocked -> UI keeps running, Saving..., Save disabled",
          time.time() - t0 < 2 and app.saving and app.status_label.cget("text") == "Saving..."
          and str(app.save_button["state"]) == "disabled")
    gates["season"].set()
    yield lambda: app.saving == 0
    check("H save completes after release", row(1031)[0]["Seasons Watched"] == "1,2,3", row(1031))

    # I1: the same season saved twice concurrently (two panels) is counted once
    details_1032 = app.client.details("1032")
    before = int(row(1032)[0]["Episodes Watched"])
    dialogs.clear()
    app._save_seasons("1032", details_1032, [2])
    app._save_seasons("1032", details_1032, [2])
    yield lambda: app.saving == 0
    r = row(1032)[0]
    check("I1 concurrent saves of season 2: episodes added once, second reports Already Saved",
          r["Seasons Watched"] == "1,2,3" and int(r["Episodes Watched"]) == before + 8
          and any(d[1] == "Already Saved" for d in dialogs), (r, dialogs))

    # I2: a hand-edited row with an extra field doesn't abort (or truncate) a rewrite
    with open(CSV, encoding="utf-8") as f:
        lines = f.read().splitlines()
    bad = lines[1].replace("1030,", "1099,", 1) + ",EXTRA"
    with open(CSV, "w", encoding="utf-8", newline="") as f:
        f.write("\r\n".join([lines[0], bad] + lines[1:]) + "\r\n")
    n_before = len(app.store.load()[1])
    r = dict(row(1031)[0])
    r["Tagline"] = "rewritten"
    app.store.update("1031", r)
    after = app.store.load()[1]
    check("I2 rewrite with an extra-field row: no rows lost, update applied",
          len(after) == n_before and row(1031)[0]["Tagline"] == "rewritten" and row(1032) and row(1099),
          (n_before, len(after)))
    check("I2 no temp files left behind", not [n for n in os.listdir(os.path.dirname(CSV)) if n.endswith(".tmp")])

    # I3: a UTF-8 BOM (Excel "CSV UTF-8") doesn't hide existing rows
    with open(CSV, "rb") as f:
        raw = f.read()
    with open(CSV, "wb") as f:
        f.write(b"\xef\xbb\xbf" + raw)
    check("I3 BOM file: existing row still found (no duplicate on save)",
          app.store.get("1030") is not None and len(row(1030)) == 1)

    # I4: a failing CSV write (e.g. file open in Excel) shows an error and re-enables Save
    r = dict(row(1031)[0])
    r["Seasons Watched"] = "1,2"
    app.store.update("1031", r)
    real_update = app.store.update

    def locked(*a, **k):
        raise PermissionError(13, "Permission denied", CSV)

    app.store.update = locked
    dialogs.clear()
    app._save_seasons("1031", app.client.details("1031"), [3])
    yield lambda: app.saving == 0 and dialogs
    app.store.update = real_update
    err = [d for d in dialogs if d[0] == "showerror"]
    check("I4 write failure: error dialog shown, Save re-enabled, row unchanged",
          err and "PermissionError" in err[0][2] and str(app.save_button["state"]) == "normal"
          and row(1031)[0]["Seasons Watched"] == "1,2", (dialogs, app.save_button["state"]))

    # Idle: the result queue stops being polled once no work is in flight
    ok = yield lambda: not app._polling
    check("idle: poll loop stopped (no timer while nothing is pending)", ok and app._pending == 0, (app._polling, app._pending))

    check("API key never written to the CSV", KEY not in open(CSV, encoding="utf-8").read())
    check("every TMDB request ran off the main thread (whole run)", not any(c[2] for c in calls))
    print(f"\n{sum(ok for _, ok in results)}/{len(results)} passed")


def drive(steps):
    """Step the scenario inside mainloop. A yielded callable is a wait condition (8s timeout)."""
    state = {"cond": None, "deadline": 0.0}

    def tick():
        try:
            cond = state["cond"]
            if cond is not None:
                done = cond()
                if not done and time.time() < state["deadline"]:
                    root.after(20, tick)
                    return
                val = steps.send(bool(done))
            else:
                val = steps.send(None)  # same as next() on a not-yet-started generator
            state["cond"] = val if callable(val) else None
            state["deadline"] = time.time() + 8
            root.after(20, tick)
        except StopIteration:
            root.quit()
        except Exception:
            traceback.print_exc()
            results.append(("scenario crashed", False))
            root.quit()

    root.after(50, tick)
    root.mainloop()


try:
    drive(scenario())
    for ev in gates.values():
        ev.set()  # release any worker still waiting
    root.destroy()
finally:
    shutil.rmtree(TMP, ignore_errors=True)
sys.exit(0 if results and all(ok for _, ok in results) else 1)
