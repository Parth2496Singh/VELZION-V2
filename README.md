
<div align="center">

# 🚀 Project Velzion
**The Open-Source BYOC Control Plane for Automated Deployments & Ephemeral Environments**

<div align="center" style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/n8n-FF6600?style=for-the-badge&logo=n8n&logoColor=white" />
  <img src="https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" />
  <img src="https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/ArgoCD-EF7B4D?style=for-the-badge&logo=argo&logoColor=white" />
</div>

</div>
Modern cloud development is caught in a paradox: developers crave the flawless, zero-configuration deployment experiences of modern PaaS providers, while startups face brutal pricing markups, lack of deep database isolation, and severe data privacy risks on shared platforms. 

**Velzion resolves this tension.** As an enterprise-grade, open-source Bring Your Own Cloud (BYOC) DevOps Control Plane, Velzion acts strictly as an orchestration brain—it owns zero compute. It turns a company’s private AWS infrastructure into a self-hosted, automated app platform, guaranteeing 100% data residency and zero vendor premium markups.

---

## ✨ Key Features
* 🎛️ **Granular Hardware Control:** Select your exact AWS EC2 Instance Type (e.g., `t3.small`, `c5.large`) and dynamically scale your EBS Storage (10GB - 200GB) directly from the UI before deploying.
* ⚡ **1-Click Ephemeral Environments:** Automatically spin up cheap AWS Spot instances the moment a Pull Request is opened, and auto-destroy them when closed (Zero Idle Cost).
* 📊 **Live OTLP Telemetry:** Stream live CPU and RAM hardware utilization matrices directly from your AWS instances to the React dashboard in real-time.
* ☁️ **Absolute Data Residency:** Since Velzion provisions inside *your* AWS account via temporary STS roles, your databases and application code never touch our servers.
* 🏗️ **Dual-Engine Architecture:** Use **Zegion** for rapid, ephemeral PR previews, and **Velzard** for rock-solid, highly-available production clusters.

---

## 🛑 The Problem

Small to mid-sized engineering teams struggle with two massive operational bottlenecks:
1. **The PaaS Financial Markup Trap:** Hosted platforms charge massive premium markups over raw AWS compute costs, draining early-stage startup capital.
2. **The Persistent Staging Server Waste:** To avoid high bills, teams use a single, shared staging server. This creates massive developer friction: migration conflicts, overwritten branches, blocked QA cycles, and thousands of dollars wasted on idle compute hours.

---

## 🚂 The Solution: Dual-Engine BYOC Architecture

Velzion orchestrates infrastructure directly inside the user's secure AWS environment using a decoupled, event-driven architecture split into two execution pipelines:

* 🏗️ **Velzard (The Production Engine):** For core workloads requiring 24/7 high availability, Velzard automates infrastructure provisioning directly inside the user's AWS account. It configures dedicated EC2 On-Demand resources, Nginx reverse proxy routing, and launches the application via production-hardened configurations.
* 🌪️ **Zegion (The Ephemeral Preview Engine):** Eliminates the single staging server bottleneck entirely. Powered by **n8n** as the automation engine, Zegion listens for GitHub Pull Request events, dynamically boots ultra-cheap AWS Spot instances, compiles code using CNCF Buildpacks, posts a live wildcard preview link to the PR comments, and tears the infrastructure down the second the PR is closed.

---

## 💡 Operational Innovations & FinOps Strategy

* **Two-Tier Zero-Cost Networking:** Tier 1 Terraform provisions a custom VPC with a pure Public Subnet and Internet Gateway. Because it avoids NAT Gateways, idle networking costs exactly **$0.00**. Tier 2 dynamically drops ephemeral Spot instances into this pre-built VPC.
* **Deterministic CNCF Buildpacks:** Zegion utilizes the official CNCF `pack` CLI and `paketobuildpacks/builder-jammy-base` to automatically detect repository language and compile an optimized, OCI-compliant container image—bypassing manual Dockerfiles entirely.
* **Scale-to-Zero Preview Lifecycle:** Ephemeral environments have a strict TTL expiration. When a PR sits idle, n8n auto-destructs the Spot instance and updates its state to `SLEEPING`, guaranteeing a true zero-dollar idle cost profile.
* **ChatOps & Security by Obscurity:** PR links utilize cryptographically hashed wildcard URLs (e.g., `pr-42-x7f9a2p.velzion.dev`). To wake a sleeping PR, developers simply type `/velzion wake` in the GitHub PR comments, and a fresh instance boots automatically within 60 seconds.

---

## 🛠️ Tech Stack

Velzion integrates a diverse set of modern tooling to synthesize application orchestration, infrastructure automation, and continuous delivery into a single platform.

### Control Plane 
* **Backend:** Django, Django REST Framework (DRF), Python
* **Frontend:** React, Vite, Tailwind CSS
* **Database (State):** PostgreSQL
* **Event Broker / Workflow Engine:** n8n (Node-Based Workflow Automation)

### Infrastructure Engine 
* **Infrastructure as Code (IaC):** Terraform, AWS CloudFormation (IAM Trust Delegation)
* **Cloud Provider:** Amazon Web Services (AWS) - VPC, EC2 On-Demand, EC2 Spot Instances, S3 (State Backend)
* **Compute Provisioning:** AWS STS (AssumeRole Credentials), Bash (`user_data.sh`)
* **Compilation:** CNCF Buildpacks (`pack` CLI)

### DevOps & Platform Engineering 
* **Containerization:** Docker, Docker Compose
* **Orchestration:** Kubernetes (Amazon EKS)
* **CI/CD Pipeline:** Jenkins (CI), ArgoCD (GitOps CD), Helm
* **Security & Observability:** Trivy (Vulnerability Scanning), SonarQube (Static Analysis), AWS CloudWatch

### The 1-Click Trust Model (Security Upgrade)
Velzion **never asks users to input raw AWS Access Keys**. 
Instead, we implemented an **Enterprise IAM Role Binding architecture**. The React frontend directs users to launch a pre-configured CloudFormation stack in their AWS console. This stack creates an IAM Role that explicitly trusts the Velzion backend. When you link this role via the UI, it is securely vaulted in your PostgreSQL `UserProfile`.

When n8n executes Terraform, the Django backend dynamically calls `boto3.client('sts').assume_role`, generates short-lived cryptographic tokens, and injects them directly into the n8n execution environment valid only for the deployment duration.

## 🏛️ System Architecture

```mermaid
graph TD
    User([Developer / GitHub PR]) -->|Webhook Event| Django[Django Control Plane]
    
    subgraph Control_Plane [Velzion BYOC Matrix]
        Django -->|Trigger Deploy/Destroy| n8n[n8n Workflow Automation]
        Django ---|State/Telemetry| DB[(PostgreSQL Database)]
        
        n8n -->|Generate IaC & Inject STS| TF[Terraform Engine]
        TF -.->|Assumes Temp IAM Role| AWS[AWS Cloud]
    end

    subgraph AWS_Cloud [User AWS Account]
        AWS -->|Provisions VPC & Instances| EC2[EC2 Dedicated/Spot Node]
        EC2 -->|OTLP Telemetry| Django
        EC2 -->|Wildcard Proxy| Nginx[Nginx Reverse Proxy]
        Nginx -->|Routes Traffic| AppContainer[Deployed Docker App]
    end
```

---

## 🚀 Beginner Setup Guide: n8n Workflow Orchestration

To run Velzion, you must import the core orchestration workflow into your n8n instance.

### Step 1: Access n8n
1. After running `docker compose up -d`, navigate to your n8n dashboard: `http://<your-ec2-ip>:5678`.
2. Create an initial owner account (if this is your first time booting).

### Step 2: Import the Velzard Workflow
1. In the n8n left sidebar, click **Workflows** -> **Add Workflow**.
2. In the top right corner, click the **Options (three dots) menu**.
3. Select **Import from File...**
4. Choose the `VELZARD-WORKFLOW.json` file located in the `workflows/` directory of this repository.

### Step 3: Activate the Webhook
1. Once imported, you will see the full automation graph.
2. At the top right of the screen, toggle the workflow from **Inactive** to **Active**.
3. *Critical:* Make sure you save the workflow!

Now, whenever you click "Ignite Cluster" in the Velzion UI, the Django backend will securely pass the IAM credentials and infrastructure payload directly to this workflow!

---

### Backend Structure & Modular Boundaries
Velzion enforces strict domain boundaries using a **Modular Monolith** architecture built on Django, exposing strict RESTful endpoints.
* `backend/users/`: Handles GitHub OAuth and JWT issuance.
* `backend/velzard/`: Manages the persistent BYOC deployments and IAM state.
* `backend/zegion/`: The ingestion point for GitHub webhooks and TTL logic.

### Database Strategy
Django acts as the central State Machine backed by a single **PostgreSQL** database. Multi-tenancy isolation is enforced logically via tenant foreign keys, tracking repository metadata, VPC IDs, and AWS Role ARNs.

### The 1-Click Trust Model (Security)
Velzion **never asks users to input raw AWS Access Keys**. 
For deployment access, the React frontend redirects users to launch a pre-configured CloudFormation stack in their AWS console. This stack creates an IAM Role that explicitly trusts the central Velzion AWS account. When n8n executes Terraform, it calls AWS STS to assume the role, generating short-lived cryptographic tokens valid only for the deployment duration.

---

## 🐙 Zegion Orchestration Lifecycle

1. Developer opens a PR ➔ GitHub fires a webhook to the Django API.
2. Django writes `PROVISIONING` state to PostgreSQL and forwards the payload to n8n.
3. n8n executes Tier 2 Terraform using STS temporary credentials to boot an AWS EC2 Spot Instance.
4. The instance boots via `user_data.sh`, installs Docker/Git/pack CLI, clones the PR branch, and executes CNCF Buildpack compilation.
5. n8n queries the instance IP, maps the wildcard DNS proxy, and posts the live URL back to the PR comments.

---

## 📁 Repository Structure

Velzion is split across two primary repositories to enforce strict GitOps separation of concerns between Application Code and Infrastructure State.

### 1. Infrastructure Configuration [VELZION](https://github.com/Parth2496Singh/VELZION.git)
```text
velzion/
├── frontend/               # React SPA (Vite, Tailwind)
│   ├── src/pages/          # Velzard & Zegion Dashboards, FinOps, Auth
│   └── nginx.conf          # Reverse proxy configuration
├── backend/                # Django Control Plane
│   ├── core/               # Django Settings & DRF Configuration
│   ├── users/              # GitHub OAuth & User Profiles
│   ├── velzard/            # Production BYOC Engine & API
│   ├── zegion/             # Ephemeral Preview Engine & Webhooks
│   └── terraform/          # IaC configurations (main.tf, velzard_main.tf)
├── workflows/              # Exported n8n JSON pipelines (Zegion & Velzard)
├── docker-compose.yml      # Local development cluster orchestration
└── Jenkinsfile             # CI/CD Pipeline definition
```
### 2. Continuous Delivery [VELZION-GITOPS](https://github.com/Parth2496Singh/VELZION-GITOPS)
```text
velzion-gitops/
├── Chart.yaml              # Helm chart metadata and dependencies
├── gitops/                 # Continuous Delivery Configurations
│   ├── applicationset-velzion.yaml  # ArgoCD ApplicationSet definition
│   └── argocd-notifications-cm.yaml # Slack/Email deployment alerts
├── templates/              # Kubernetes Manifests (Helm Templates)
│   ├── backend-deployment.yaml      # Django control plane pods
│   ├── db-statefulset.yaml          # PostgreSQL persistent volume claims
│   ├── frontend-deployment.yaml     # React frontend pods
│   ├── ingress.yaml                 # Nginx ingress routing rules
│   ├── n8n-deployment.yaml          # n8n automation engine pods
│   └── services.yaml                # Internal cluster networking
└── values.yaml             # Environment-specific variable overrides
```
## 👶 Beginner's Guide: Step-by-Step Installation

We've made deploying Velzion as simple as possible. Whether you're running it on your laptop or a cloud server, follow these exact steps.

<details>
<summary><h3>💻 Option 1: Local Setup (For Development on your Laptop)</h3></summary>

**Step 1: Clone the Project**
Open your terminal and download the code:
```bash
git clone https://github.com/Parth2496Singh/VELZION.git
cd VELZION
```

**Step 2: Set up the Environment Variables**
We need to give the app its passwords. We have provided a template for you:
```bash
cp .env.example .env
```
Open the `.env` file in your code editor. 
- You don't need to change `DJANGO_SECRET_KEY` or `N8N_WEBHOOK_SECRET` for local use.
- **Database:** Go to **[Neon.tech](https://neon.tech/)** (Highly Recommended) or Supabase to create a free Postgres database. 
  - *If using Neon:* Just paste their standard connection string. It works out of the box (IPv4).
  - *If using Supabase:* You **MUST** use their **"Shared Connection Pooler"** URL (Port 6543). Do NOT use the direct connection or dedicated pooler, as they are IPv6-only and will crash AWS EC2 instances.
- **GitHub:** Go to GitHub -> Settings -> Developer Settings -> OAuth Apps. Create one with Homepage `http://localhost:5173` and Callback `http://localhost:5173/auth/callback`. Paste the Client ID and Secret into your `.env`. Create a Personal Access Token and paste it into `GITHUB_PAT`.

**Step 3: Run the Application!**
Make sure Docker is installed and running on your computer, then run:
```bash
docker-compose up --build
```
*Wait a few minutes for everything to download and start.*

**Step 4: Access Velzion**
- 🌐 Frontend Dashboard: `http://localhost:5173`
- ⚙️ Backend API: `http://localhost:8000`
- 🤖 n8n Automations: `http://localhost:5678`

</details>

<details>
<summary><h3>☁️ Option 2: EC2 Production Setup (For Live Cloud Servers)</h3></summary>

> **⚠️ CRITICAL AWS REQUIREMENT (SECURITY GROUPS)**
> By default, AWS EC2 instances block all web traffic. Before you begin, go to your AWS Console -> EC2 -> Security Groups, and add **Inbound Rules** to allow:
> - **HTTP (Port 80)** - For the React Frontend (Nginx)
> - **Custom TCP (Port 8000)** - For the Django API
> - **Custom TCP (Port 5678)** - For the n8n Webhook Engine

**Step 1: Connect to your EC2 Server**
SSH into your AWS EC2 instance (Ubuntu recommended):
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

**Step 2: Install Docker and Git**
If it's a brand new server, install the required tools:
```bash
sudo apt update
sudo apt install -y git docker.io docker-compose
sudo usermod -aG docker ubuntu
# Log out and log back in for docker groups to apply
```

**Step 3: Clone the Project**
Download the code to your server:
```bash
git clone https://github.com/Parth2496Singh/VELZION.git
cd VELZION
```

**Step 4: Set up the Production Environment Variables**
```bash
cp .env.example .env
nano .env
```
Now fill in your `.env` file:
- **Change** `DJANGO_SECRET_KEY` and `N8N_WEBHOOK_SECRET` to random, secure passwords!
- **Database (CRITICAL IPv6 FIX):** Paste your Supabase/Neon credentials. **IF USING SUPABASE**, you MUST use the **IPv4 Connection Pooler URL (Port 6543)**. Standard AWS EC2 instances cannot route IPv6, and the direct port 5432 will throw a "Network is unreachable" error.
- **GitHub:** Create a GitHub OAuth App with your EC2's Public IP (e.g., `http://13.221.146.6` and `http://13.221.146.6/auth/callback`) and paste the IDs. Paste your `GITHUB_PAT`.
- **AWS Credentials:** Fill in `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` so Velzion can provision infrastructure.
- **Frontend URLs:** Change `VITE_API_BASE_URL` to your backend API URL (e.g., `http://13.221.146.6:8000`). Change `VITE_N8N_WEBHOOK_URL` to your n8n URL (e.g., `http://13.221.146.6:5678`).
- **Backend URL for GitHub Auth:** Ensure `FRONTEND_URL` is set to exactly your EC2 public IP without a trailing slash (e.g., `FRONTEND_URL=http://13.221.146.6`). This is CRITICAL for GitHub OAuth redirect matching.
- **n8n Host Binding (CRITICAL):** You MUST set `N8N_HOST` to your EC2 Public IP (e.g., `N8N_HOST=13.221.146.6`) inside your `.env` file! If it is left as `localhost` or `0.0.0.0`, n8n will fail to load its frontend assets and the page will be blank.
- Press `CTRL+X`, then `Y`, then `Enter` to save and exit nano.

**Step 5: Run the Production Build!**
We use a special command for EC2 that builds an optimized, lightning-fast Nginx version of the app:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```
*(The `-d` flag runs it in the background so it stays alive when you close your SSH terminal).*

**Step 7: Import & Activate n8n Workflows (Detailed Beginner Guide)**
For Velzion to orchestrate infrastructure, the n8n engine needs its instructions. Follow these exact steps to load the Velzard and Zegion workflows:

1. **Access the n8n Dashboard:** Open your web browser and go to your EC2's n8n port: `http://your-ec2-ip:5678` (Make sure Port 5678 is open in your AWS Security Groups).
2. **Initial Setup:** You will be prompted to create an owner account. Enter your email and a secure password.
3. **Navigate to Workflows:** Once logged in, click on **Workflows** in the left-hand menu, then click the **"Add Workflow"** button in the top right.
4. **Copy the Workflow Code:** 
   - Open a new tab and go to the Velzion GitHub repository: `https://github.com/Parth2496Singh/VELZION`
   - Navigate to the `workflows/` folder.
   - Click on `VELZARD-WORKFLOW.json`.
   - Click the "Copy raw file" button (the two squares icon near the top right of the code block) to copy the entire JSON code to your clipboard.
5. **Paste into n8n:** Go back to your n8n dashboard (where you have the new blank workflow open). Simply click anywhere on the blank canvas and **Paste (CTRL+V or CMD+V)**. The workflow nodes will magically appear!
6. **Activate the Workflow (CRITICAL):** 
   - In the top right corner of the n8n screen, toggle the switch from **Inactive** to **Active**. 
   - *Why is this important?* If it remains inactive, Django will receive a `404 Not Found` error when it tries to trigger deployments. The workflow must be active to listen to production webhooks!
7. **Repeat for Zegion:** Repeat steps 3-6, but this time copy the code from `ZEGION WORKFLOW.json`.

</details>

---

## 🤖 How the n8n Orchestration Workflows Actually Work

Velzion uses **n8n** as a powerful, visual, node-based orchestration engine. Instead of writing thousands of lines of complex Python background tasks, n8n handles the state machine and AWS API interactions.

### 🌪️ Zegion Workflow (The PR Preview Engine)
1. **The Webhook Trigger:** Django receives a PR event from GitHub and forwards it to n8n via an internal Docker network request to `http://n8n:5678/webhook/zegion-pr`.
2. **The "Gatekeeper" Branch:** n8n checks the action. If `opened`, it moves to deploy. If `closed`, it routes to the teardown sequence.
3. **The Execute Command Node (Terraform):** n8n dynamically creates a folder (`workspace_pr_123`), copies the baseline `main.tf` into it, and runs `terraform apply -var="pr_number=123"`. 
4. **Metadata Extraction & Callbacks:** n8n extracts the live `public_ip` from the Terraform output JSON. It fires two simultaneous API requests: one to GitHub to comment the live link, and one to Django to update the DB state to `RUNNING`.
5. **The FinOps TTL Node:** Simultaneously, a parallel execution branch enters a **Wait Node** for 10 minutes. Once 10 minutes pass, it hits the AWS EC2 API to gracefully hibernate (`StopInstances`) the Spot instance, saving 100% of compute costs while preserving disk state.

### 🏗️ Velzard Workflow (The Production Engine)
1. **The Ignite Trigger:** Clicking "Ignite" in the React UI triggers Django to send the validated YAML contract (CPU limits, volume size) to the `webhook/velzard-deploy` n8n endpoint.
2. **Infrastructure Compilation:** n8n passes these specific arguments into `terraform apply` using the `velzard_main.tf` template.
3. **AWS State Sync:** n8n extracts the permanent `instance_id` and `elastic_ip` and securely updates the Django database so the telemetry engine can begin listening for OTLP streams from that exact hardware.

---

## ☸️ Control Plane Infrastructure & CI/CD (EKS GitOps)
The core Velzion Control Plane operates as a cloud-native application deployed to Amazon EKS. Local development utilizes Docker Compose to orchestrate the monolith seamlessly.

**Continuous Integration**: Jenkins (Jenkinsfile) drives the DevSecOps pipeline, running SonarQube for static analysis and Trivy for container vulnerability scanning.

**Continuous Delivery**: Executed via ArgoCD monitoring the velzion-gitops repository. It pulls Helm manifested configurations directly into the EKS cluster via a strict GitOps model.

**State Management**: Terraform execution states are securely bound to an AWS S3 remote backend to protect against pod restarts.

**Observability**: System logs and container metrics are piped to AWS CloudWatch.

---

## 🐳 Docker Image Build & Push Guide (SemVer Versioning)

If you are deploying Velzion to a Kubernetes cluster or a remote EC2 machine, you will want to build and push your Docker images to a container registry (like Docker Hub or AWS ECR) using Semantic Versioning (SemVer).

### 1. Tagging Strategy
Always tag your images with a specific semantic version (e.g., `v1.2.0`) rather than relying purely on `latest`. This ensures repeatable, rollback-safe deployments.

### 2. Building & Pushing the Backend & n8n
These are standard builds that inject the code into the image:

```bash
# Build and tag the images
docker build -t your-registry/velzion-backend:v1.2.0 ./backend
docker build -t your-registry/velzion-n8n:v1.2.0 -f ./backend/n8n.Dockerfile ./backend

# Push the images to your registry
docker push your-registry/velzion-backend:v1.2.0
docker push your-registry/velzion-n8n:v1.2.0
```

### 3. Building & Pushing the Frontend (Important: Build Args)
Unlike the backend, the React frontend is compiled into static files *during* the Docker build process. It needs to know the production URLs at compile time. You **must** pass these via `--build-arg`:

```bash
# Define your production EC2/Domain IPs
export PROD_API_URL="http://your-production-domain.com/api"
export PROD_WEBHOOK_URL="http://your-production-domain.com/webhook"

# Build the frontend with arguments injected
docker build \
  --build-arg VITE_API_BASE_URL=$PROD_API_URL \
  --build-arg VITE_N8N_WEBHOOK_URL=$PROD_WEBHOOK_URL \
  -t your-registry/velzion-frontend:v1.2.0 \
  ./frontend

# Push the frontend image
docker push your-registry/velzion-frontend:v1.2.0
```

### 4. Updating your `docker-compose.prod.yml`
Once pushed, you can update your EC2 machine to simply pull the images instead of building from source! Replace `build:` with `image: your-registry/velzion-frontend:v1.2.0` in your production compose file.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
