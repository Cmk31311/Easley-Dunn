# Google Analytics prod key

JSON goes in `googleanalytics_json/` on the API (not in git).

## Needs

- GA4 account or property ID (`accounts/…` or `properties/…`)
- Service account that can manage users there
- JSON key on the server
- `GOOGLE_ANALYTICS_PARENT_RESOURCE` set on the API (needed for first onboard)

Default grant: Analyst (`predefinedRoles/analyst`).

## Setup

1. Enable **Google Analytics Admin API** on the GCP project.
2. Create a service account and download the JSON key.
3. In Analytics Admin → Account (or Property) access management, add the SA as **Administrator**.
4. Set `GOOGLE_ANALYTICS_PARENT_RESOURCE` and drop the JSON into `googleanalytics_json/`. Restart the API.

## Before calling it live

Onboard a test user, check Analyst in GA, offboard, confirm removal in GA and in Cerberus audit.
