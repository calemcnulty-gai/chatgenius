# AWS Deployment Requirements

## Current Approach: Direct EC2 Deployment

### Infrastructure Status
1. EC2 Instance
   - ID: `i-09f8a1e3a1743f339`
   - Type: t2.micro (1 vCPU, 1GB RAM)
   - Public IP: `50.19.156.154`
   - VPC: vpc-0a190df8a39e2d108 (cm-gauntlet-vpc)
   - Subnet: subnet-054a0605f580b61fe
   - Security Group: sg-0236f7b58e1b86c55 (cm-chatgenius-sg)
   - Key Pair: cm-chatgenius
   - Status: ✅ Running

2. Security Group Rules
   - HTTP (80): ✅ Allowed from anywhere
   - HTTPS (443): ✅ Allowed from anywhere
   - PostgreSQL (5432): ✅ Allowed from anywhere
   - SSH (22): ✅ Allowed from anywhere

3. Docker Configuration
   - Status: ✅ Auto-installed via user data script
   - Web Container: 474668398195.dkr.ecr.us-east-1.amazonaws.com/chatgenius:latest
   - Database: postgres:15
   - Volume: Local EBS storage for PostgreSQL data
   - Environment: Uses `.env.production` for Docker-specific variables

### Access Information
1. SSH Access:
   ```bash
   ssh -i /path/to/cm-chatgenius.pem ec2-user@50.19.156.154
   ```

2. Application Access:
   - Web: http://50.19.156.154
   - Database: postgresql://postgres:${POSTGRES_PASSWORD}@50.19.156.154:5432/postgres
   - Note: Password is auto-generated on first boot and stored in `/app/.env.production`

### Monitoring
1. Application Logs:
   ```bash
   ssh -i /path/to/cm-chatgenius.pem ec2-user@50.19.156.154 'docker-compose -f /app/docker-compose.yml logs -f'
   ```

2. System Status:
   ```bash
   ssh -i /path/to/cm-chatgenius.pem ec2-user@50.19.156.154 'docker-compose -f /app/docker-compose.yml ps'
   ```

### Backup Strategy
1. Database Backups:
   - Location: Local EBS volume
   - Backup Command:
     ```bash
     ssh -i /path/to/cm-chatgenius.pem ec2-user@50.19.156.154 'docker exec app_db_1 pg_dump -U postgres > backup.sql'
     ```

### Next Steps
1. Monitor instance startup:
   ```bash
   ssh -i /path/to/cm-chatgenius.pem ec2-user@50.19.156.154 'tail -f /var/log/cloud-init-output.log'
   ```

2. Get production database password:
   ```bash
   ssh -i /path/to/cm-chatgenius.pem ec2-user@50.19.156.154 'cat /app/.env.production'
   ```

3. Future Improvements:
   - Set up automated database backups to S3
   - Add CloudWatch monitoring
   - Configure SSL/TLS with Let's Encrypt
   - Set up a custom domain name 

# AWS Deployment Notes

## Deployment History
We initially attempted to deploy using AWS ECS and Elastic Beanstalk but encountered several permission issues. We ultimately switched to a direct EC2 deployment approach.

## Permission Issues

### Critical Permissions Missing
1. `iam:PassRole` ❌
   - Required for: Passing IAM roles to ECS tasks and Elastic Beanstalk environments
   - Resource: `arn:aws:iam::474668398195:role/*`
   - Impact: Blocked both ECS and Elastic Beanstalk deployments
   - Error: "Unable to assign role. Please verify that you have permission to pass this role"

2. `iam:CreateRole` ❌
   - Required for: Creating ECS task execution roles and Elastic Beanstalk instance profiles
   - Resource: `arn:aws:iam::474668398195:role/*`
   - Impact: Could not create necessary IAM roles for services

3. `elasticfilesystem:CreateFileSystem` ❌
   - Required for: Setting up EFS for PostgreSQL persistence in ECS
   - Resource: `*`
   - Impact: Could not create persistent storage for database

### Optional Permissions Missing
1. `cloudtrail:LookupEvents` ❌
   - Required for: Auditing resource creation and identifying resource owners
   - Resource: `*`
   - Impact: Limited ability to troubleshoot ownership of existing resources

## Resource Limits
- VPC limit reached (maximum of 5 VPCs)
- Existing VPCs:
  - vpc-0a190df8a39e2d108 (cm-gauntlet)
  - Used for current EC2 deployment

## Current Deployment
- Using direct EC2 deployment with Docker
- Instance ID: i-0751ac0cd3258ea3e
- Public IP: 44.218.104.132
- Security Group: sg-0236f7b58e1b86c55 (allows ports 80, 443, 5432, 22)

## Next Steps
1. Request `iam:PassRole` permission for future managed service deployments
2. Consider cleanup of unused VPCs
3. Implement automated backups for EC2-hosted PostgreSQL
4. Set up CloudWatch monitoring 