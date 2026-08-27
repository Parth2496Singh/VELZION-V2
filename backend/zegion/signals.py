import requests
import threading
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Project

def send_zegion_trigger(project_id, repo_url, role_arn):
    import subprocess
    import os
    import boto3
    from django.conf import settings
    
    tf_dir = f"/tmp/zegion_project_{project_id}"
    try:
        os.makedirs(tf_dir, exist_ok=True)
        # Assuming you have a zegion_main.tf equivalent, or use velzard's for now
        tf_source = os.path.join(settings.BASE_DIR, "terraform", "velzard_main.tf")
        subprocess.run(f"cp {tf_source} {tf_dir}/main.tf || true", shell=True)
        
        env = os.environ.copy()
        try:
            sts_client = boto3.client('sts')
            assumed_role = sts_client.assume_role(
                RoleArn=role_arn,
                RoleSessionName=f"ZegionSession-{project_id}"
            )
            env['AWS_ACCESS_KEY_ID'] = assumed_role['Credentials']['AccessKeyId']
            env['AWS_SECRET_ACCESS_KEY'] = assumed_role['Credentials']['SecretAccessKey']
            env['AWS_SESSION_TOKEN'] = assumed_role['Credentials']['SessionToken']
        except Exception as aws_e:
            print(f"Failed to assume role for Zegion: {aws_e}")

        # Initialize & Apply Zegion Environment
        subprocess.run(["terraform", "init"], cwd=tf_dir, env=env)
        subprocess.run([
            "terraform", "apply", "-auto-approve",
            f"-var=repo_url={repo_url}",
            f"-var=branch=main",
            f"-var=deployment_id={project_id}",
            f"-var=instance_type=t3.small",
            f"-var=volume_size=8",
            f"-var=backend_url=http://localhost:8000"
        ], cwd=tf_dir, env=env)
        
        print(f"📡 Pure Python Zegion Triggered for {repo_url} using {role_arn}")
    except Exception as e:
        print(f"⚠️ Outbound automation hook failed: {e}")

@receiver(post_save, sender=Project)
def trigger_infrastructure_pipeline(sender, instance, created, **kwargs):
    if created:
        print(f"⚡ Project Row Created in Postgres. Spinning background orchestration worker thread...")
        # Execute asynchronously so the React frontend form doesn't hang waiting for AWS
        threading.Thread(
            target=send_zegion_trigger,
            args=(instance.id, instance.github_repo_url, instance.aws_role_arn)
        ).start()