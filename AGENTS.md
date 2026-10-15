# Publication workflow

The user requires completed website work to be pushed to GitHub and verified at
the public URL. This instruction authorizes normal commits, pushes to main, and
deployment for requested website work. Preserve unrelated user changes.

After making changes, perform relevant local checks, commit the intended files,
push to `origin/main`, and wait for the Pages workflow including its public
verification step. Do not call a deployment verified merely because the files
were pushed or the deployment job started. Report failures and concrete blockers.

The public site is https://cafelzj.github.io/research/ . The workflow checks that
the public `index.html` and `atlas.html` return HTTP 200 and exactly match the
committed files. Where browser access is available, also check the changed user
flow through the public URL. This external content check does not replace local
browser interaction checks.
