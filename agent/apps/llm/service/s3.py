import logging
import boto3
from django.conf import settings
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class S3Service:
    """Handles uploading generated website files to AWS S3."""

    def __init__(self) -> None:
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        if self.bucket_name:
            self.s3 = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION,
            )
        else:
            self.s3 = None
            logger.warning("AWS_STORAGE_BUCKET_NAME not configured. S3Service will be inactive.")

    def upload_files(self, user_id: int, project_name: str, files: dict) -> dict:
        """Uploads files to a user-specific folder in S3."""
        if not self.s3:
            return {"status": "skipped", "reason": "S3 bucket not configured"}

        results = []
        base_path = f"users/{user_id}/projects/{project_name}"

        for file_path, content in files.items():
            if file_path == "summary":
                continue
            
            s3_key = f"{base_path}/{file_path}"
            try:
                self.s3.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=content.encode("utf-8"),
                    ContentType=self._get_content_type(file_path),
                )
                results.append(s3_key)
            except ClientError as e:
                logger.error(f"Failed to upload {file_path} to S3: {str(e)}")
                return {"status": "error", "error": str(e)}

        return {"status": "success", "uploaded_keys": results}

    def _get_content_type(self, file_path: str) -> str:
        if file_path.endswith(".html"): return "text/html"
        if file_path.endswith(".css"): return "text/css"
        if file_path.endswith(".js") or file_path.endswith(".jsx"): return "application/javascript"
        if file_path.endswith(".json"): return "application/json"
        return "text/plain"
