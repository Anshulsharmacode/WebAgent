import json
import logging
import boto3
from django.conf import settings

logger = logging.getLogger(__name__)

class SQSService:
    """Handles pushing generated website files to AWS SQS."""

    def __init__(self) -> None:
        self.queue_url = settings.SQS_QUEUE_URL
        if self.queue_url:
            self.sqs = boto3.client(
                "sqs",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
        else:
            self.sqs = None
            logger.warning("SQS_QUEUE_URL not configured. SQSService will be inactive.")

    def push_generated_files(self, project_name: str, files: dict, metadata: dict = None) -> dict:
        """Pushes the generated files content to SQS."""
        if not self.sqs:
            return {"status": "skipped", "reason": "SQS not configured"}

        message_body = {
            "project_name": project_name,
            "files": files,
            "metadata": metadata or {},
        }

        try:
            response = self.sqs.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(message_body),
            )
            return {"status": "success", "message_id": response.get("MessageId")}
        except Exception as e:
            logger.error(f"Failed to push to SQS: {str(e)}")
            return {"status": "error", "error": str(e)}
