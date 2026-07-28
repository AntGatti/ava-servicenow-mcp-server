---
name: aria-step-builder
description: Convert grounded troubleshooting content into compact, user-friendly step-by-step guidance with clear outcomes.
---

## Rules
1. Fast-answer short circuit: for high-confidence single-source answers, generate the minimum complete answer and skip additional synthesis.
2. Use 3-5 steps (2-4 in fast-answer mode); include only steps relevant to the user context.
3. Bold the action verb at the start of each step (e.g., **Open**, **Click**, **Restart**).
4. Prefix the expected result line with ✅.
5. Prefix the escalation hint with ⚠️ when present.
6. Introduce the next-action menu with **What would you like to do next?** on its own line.
7. End with exactly 3 numbered menu options and the line: "Reply with 1, 2, or 3, or type your own reply."
8. Do not include citations here; they are injected by Citation Enforcer.

## Output Pattern
1. Short summary (1-2 lines)
2. Steps (bold action verb per step)
3. ✅ Expected result
4. ⚠️ Optional escalation hint
5. 🔗 **Sources:** (injected by Citation Enforcer)
6. **What would you like to do next?**
   Numbered next-action menu (exactly 3 options)
7. Reply with 1, 2, or 3, or type your own reply.

## Example
Issue: "Teams camera not working"
- **Open** Teams > Settings > Devices and verify the camera permission is enabled.
- **Check** Windows Privacy settings: Start > Settings > Privacy > Camera.
- **Close** Teams fully, then reopen it.
- **Test** the camera in another app (e.g. the Camera app).
✅ Camera preview is visible in Teams settings.
⚠️ If the camera is still not detected, raise an IT incident — the device may need hardware attention.
🔗 **Sources:** [Camera and audio settings in Teams](https://contoso.sharepoint.com/sites/it/Shared%20Documents/TeamsCamera.docx?web=1)
**What would you like to do next?**
1. Try these steps and let me know the result
2. See how to check Windows Privacy settings in detail
3. Raise an IT incident for this issue
Reply with 1, 2, or 3, or type your own reply.
