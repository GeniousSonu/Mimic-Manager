# MongoDB Atlas Network Access & IP Allowlist Guide

**Status:** ACTIVE  
**Target:** Render Web Service (Singapore Region) -> MongoDB Atlas M0 Cluster  

---

## 1. Network Architecture & Security Considerations

On Render's Free tier, outgoing web traffic originates from a pooled, dynamically assigned set of IP addresses in the `singapore` availability zone. Unlike dedicated Enterprise egress gateways, free instances do not have a single fixed static IP address.

To maintain maximum security while allowing Render to communicate with Atlas:

1. **SCRAM-SHA-256 Authentication:** Enforce a strong, generated 32+ character database user password.
2. **TLS / SSL Mandatory:** Connection string uses `mongodb+srv://` which strictly enforces encrypted transport.
3. **Database-Level Role Restrictions:** Grant the application user only `readWrite` on the designated database (`mimic_manager`), not cluster admin rights.

---

## 2. Atlas Network Access Configuration (Step-by-Step)

1. Log in to [MongoDB Atlas Console](https://cloud.mongodb.com/).
2. In the left navigation menu under **Security**, click **Network Access**.
3. Click the green **+ Add IP Address** button.
4. Select **Allow Access From Anywhere** (`0.0.0.0/0`).
5. In the **Comment** field, enter: `Render Singapore Free Tier Egress`.
6. Click **Confirm**.

> [!TIP]
> If you upgrade Render to a paid plan with dedicated outbound IP addresses, you can replace `0.0.0.0/0` with the specific static egress IP provided in your Render dashboard under **Settings > Outbound IP Addresses**.

---

## 3. Database User Setup

1. In the left navigation menu under **Security**, click **Database Access**.
2. Click **+ Add New Database User**.
3. **Authentication Method:** Password.
4. **Username:** `mimic_manager_user`.
5. **Password:** Click **Autogenerate Secure Password** or generate a random 32-character alphanumeric secret using `./scripts/deploy/generate-secrets.sh`.
6. **Database User Privileges:** Select **Read and write to any database** (or restrict to `mimic_manager`).
7. Click **Add User**.
8. Copy the connection string from **Database > Connect > Drivers > Node.js**:
   `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`
