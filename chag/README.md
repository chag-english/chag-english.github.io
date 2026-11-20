# CHAG

A multi-page front-end prototype for online English-class booking (navy theme, RTL/LTR, light/dark).

## Pages
- `index.html`: student sign-in and registration (with validation)
- `student.html`: student workspace (tutor filter, tutor selection, booking, "My sessions" with status + cancel)
- `teacher-login.html`: instructor sign-in
- `teacher-apply.html`: 4-step instructor application (personal info, education & credentials, expertise, availability & consent)
- `teacher.html`: instructor timetable (stats, approve pending requests, profile with meeting link)

## Run
Extract the folder and open `index.html` using VS Code Live Server.

## Demo limitations
There is no backend. Authentication, Google sign-in, application review, file uploads and shared data are simulated with `localStorage`:
- applications: `chag-teacher-applications` (file names + resized photo only; drafts in `chag-teacher-apply-draft`)
- timetable & bookings: `chag-teacher-timetable-v1` (all tutors share one timetable in this demo)
- teacher profile: `chag-teacher-profile`
Connect a backend (auth, DB, file storage, email/notifications, payments, timezone handling) before production use.


## Added in this revision
- Teacher class detail/edit form with editable date, time range, description, and booking status.
- Weekly recurring availability with either no end date or a chosen end date; recurring rules can be edited or removed from the teacher workspace.
- Central admin overview for teacher applications, timetable entries, student records, and local account blocking.
- Private chat prototype with conversation list, timestamps, sent/read labels.
- `sql/supabase-schema.sql` defines the shared database tables and row-level security policies for a real multi-device backend.

## Important backend status
This ZIP is still a front-end prototype. The admin/chat screens currently read browser `localStorage`; they are NOT secure central administration or cross-device chat yet. Run `supabase-schema.sql` in your own Supabase project, then provide the CHAG project's Supabase Project URL and anon/publishable key so the frontend can be connected. Do not use a service-role key in browser code. Real admin authorization must be enforced by Supabase Auth + RLS, not by hiding a page or checking a password in JavaScript.

See `SUPABASE_SETUP.md` for the initial Supabase setup steps.

## UI improvements in this update
- Added a Chat action below Change tutor in the selected-tutor booking card; it opens a responsive floating chat window without navigating away.
- Added a close control, distinct message bubbles, localized timestamps, and sent/read labels. The standalone messages page now has a context-aware Back button instead of role-navigation buttons.
- Expanded English/Persian language handling for the chat and admin pages, and localized teacher timetable form labels and validation prompts. The document direction follows the selected language.
- Removed the extra submit button from the class form and added a single-flight save guard to prevent accidental double submissions.
- Teacher-origin chat navigation returns to the teacher workspace; student-origin or direct chat navigation falls back to the homepage.

## Verification and remaining integration
- JavaScript files pass Node syntax checks; HTML documents were parsed; the class form was checked to contain exactly one submit control; ZIP integrity was checked.
- Interactive browser testing could not be completed in this environment, so browser-level behavior should be rechecked after opening the project with VS Code Live Server.
- Chat messages are still stored only in the current browser's `localStorage`. Receiving messages from another user/device, live updates, authentication/authorization, and secure shared booking data require the Supabase backend integration described above.
