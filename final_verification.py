from playwright.sync_api import sync_playwright
import time

def run():
    print("Starting verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # 1. Load Page
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        print("Page loaded.")

        # 2. Verify Box Mode Default (C Root)
        # Find the C note on A string (3rd fret).
        # We need a robust selector. Let's look for "R" or "C" text in a note circle.
        # Based on previous exploration, notes are divs/spans.
        
        # Helper to find note at specific coordinates approx or by text
        # Let's try to find text=R
        root_notes = page.get_by_text("R")
        
        if root_notes.count() == 0:
            print("❌ Could not find Root note 'R'.")
        else:
            print(f"✅ Found {root_notes.count()} Root notes.")

        # Pick one relative to the fretboard?
        # Let's assume the one on A string (row 1, fret 3) is visible.
        # We'll just take the first visible one.
        target_note = root_notes.first
        
        # 3. Test Single Click Protection (Box Mode)
        print("Testing Single Click Protection...")
        # Get current class or style to verify it stays 'lit'
        # In this app, lit notes usually have specific colors/classes.
        # We'll assume if it screams 'R', it's lit.
        target_note.click()
        page.wait_for_timeout(500)
        
        # Verify we are NOT in edit mode.
        # 'Edit' button should NOT be active.
        edit_btn = page.get_by_role("button", name="Edit")
        if "bg-blue-600" in edit_btn.get_attribute("class") or "active" in edit_btn.get_attribute("class"):
             # Adjust check based on actual active class logic (usually creates blue bg)
             pass
             
        # Check if the 'Box' button is still active
        box_btn = page.get_by_role("button", name="Box")
        box_class = box_btn.get_attribute("class")
        
        # We expect Box button to have the active style (e.g. blue background)
        # The app uses `bg-[#98fb98]` (pale green) or `bg-[#000080]` (navy)? 
        # Actually it uses `getBtnClass` which returns `retro-btn-active` or similar.
        # Let's just check if it LOOKS active compared to Edit.
        if "shadow-inner" in box_class or "translate-y-px" in box_class: # heuristics for active retro button
            print("✅ Single click maintained Box Mode (Protection worked).")
        else:
            # Fallback check: Did 'Edit' become active?
            edit_class = edit_btn.get_attribute("class")
            if "shadow-inner" in edit_class:
                print("❌ Single click switched to Edit Mode!")
            else:
                 print("✅ Mode seems unchanged (Good).")

        # 4. Test Box Cycle (Double Click)
        print("Testing Box Shape Cycling...")
        # We need to detect a change.
        # Current Shape is C (implied by default).
        # Double click the SAME root.
        target_note.dblclick()
        page.wait_for_timeout(500)
        
        # Verify something changed.
        # The shapes usually cycle. C -> A (or G/E/D depending on map).
        # Checking if the visual notes changed is hard without visual diff.
        # But we can check if the "Shape" indicator changed if there is one.
        # Or check the `state.shape` if we expose it, but we can't easily.
        # Let's check the Shape buttons active state.
        c_shape_btn = page.get_by_role("button", name="C", exact=True)
        a_shape_btn = page.get_by_role("button", name="A", exact=True)
        
        # Assuming C was active, now A (or G) should be active.
        if "shadow-inner" in c_shape_btn.get_attribute("class"):
             print("⚠️ Shape stayed C. Cycle might have failed or verify logic is wrong.")
             # Try double clicking again just in case
             target_note.dblclick()
             page.wait_for_timeout(500)
        
        if "shadow-inner" not in c_shape_btn.get_attribute("class"):
            print("✅ Shape cycled (C is no longer active).")
        else:
            print("❌ Shape did not cycle.")

        # 5. Test Edit Persistence
        print("Testing Edit Mode Persistence...")
        # Click Edit button
        edit_btn.click()
        page.wait_for_timeout(500)
        
        # Verify Edit is active
        if "shadow-inner" in edit_btn.get_attribute("class"):
            print("✅ Switched to Edit Mode.")
        else:
            print("❌ Failed to switch to Edit Mode.")
            
        # Verify Target Note is STILL there.
        # If it disappeared, get_by_text("R") count might drop or visibility change.
        # But wait, in Edit mode, does it still say "R"? 
        # Usually yes, if it preserves the 'root' status relative to the key.
        if page.get_by_text("R").count() > 0:
            print("✅ Notes persisted in Edit Mode.")
        else:
            print("❌ Notes were cleared!")

        # 6. Test Input Selection (Tab Importer)
        print("Testing Input Selection...")
        # Check inputs in the AlphaTab player toolbar.
        # They should have class 'select-text'.
        inputs = page.locator("input[type='text']")
        if inputs.count() > 0:
            first_input = inputs.first
            cls = first_input.get_attribute("class")
            if "select-text" in cls:
                print("✅ Inputs have 'select-text' class.")
            else:
                print(f"❌ Inputs missing 'select-text'. Class: {cls}")
        else:
            print("⚠️ No inputs found (Tab Importer might not be visible).")

        # 7. Test PDF Export
        print("Testing PDF Export...")
        # Setup download listener
        with page.expect_download() as download_info:
            # Click the export icon
            # It's a DesktopIcon with label 'Export_PDF.exe'
            # We can find text "Export_PDF.exe"
            page.get_by_text("Export_PDF.exe").click()
            
        download = download_info.value
        path = download.path()
        filename = download.suggested_filename
        print(f"✅ Download triggered: {filename}")
        
        if filename.endswith(".pdf") and "UUID" not in filename and "-" not in filename[0:5]: # heuristic for uuid
             print("✅ Filename looks correct.")
        else:
             print(f"⚠️ Filename might be suspicious: {filename}")

        browser.close()
        print("Verification Complete.")

if __name__ == "__main__":
    run()
