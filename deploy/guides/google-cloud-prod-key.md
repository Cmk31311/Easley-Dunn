# Google Cloud prod key

JSON goes in `googlecloud_json/` on the API (not in git).

Beta keeps Cloud manual until offboard only removes the role Cerberus added.

## Needs

- Target GCP project
- Service account that can edit that project’s IAM
- JSON key on the server

Default grant: Viewer (`roles/viewer`).  
Project id for new rows comes from `project_id` in the JSON.

## Setup

1. Open the project in Cloud Console.
2. Enable **Cloud Resource Manager API**.
3. Create a service account; grant **Project IAM Admin** on that project.
4. Create a JSON key; put it in `googlecloud_json/` (one `.json` file). Restart the API.

No extra env var for Cloud.

## Before Automate goes live

Confirm offboard only drops the granted role, then test onboard/offboard against IAM and the audit log.
