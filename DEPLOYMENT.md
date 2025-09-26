# FarmMarket Deployment Guide

This guide provides instructions for deploying the FarmMarket application to production.

## Prerequisites

Before deploying, ensure you have the following:

- Docker and Docker Compose installed
- A domain name (e.g., yourdomain.com)
- SSL certificates (can be self-signed for development)
- A server with at least 2GB RAM and 2 CPU cores
- MongoDB database (can be hosted or self-managed)
- Stripe account for payment processing

## Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.production .env
   ```

2. Edit the `.env` file with your production values:
   - Database connection string
   - JWT secret
   - Stripe keys
   - Domain URLs
   - Email server settings
   - Cloudinary credentials (for image uploads)
   - Analytics tracking ID

## SSL Certificates

For production, use SSL certificates from a trusted Certificate Authority (CA) like Let's Encrypt:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot

# Generate certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to the ssl directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/cert.pem ssl/key.pem
```

For development, you can generate self-signed certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem
```

## Deployment Steps

1. Clone the repository to your server:
   ```bash
   git clone https://github.com/yourusername/farmmarket.git
   cd farmmarket
   ```

2. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

4. Verify the deployment:
   ```bash
   docker-compose ps
   docker-compose logs app
   ```

## Manual Deployment

If you prefer to deploy manually without the script:

1. Build the Docker images:
   ```bash
   docker-compose build --no-cache
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. Run database migrations (if applicable):
   ```bash
   docker-compose exec app npm run migrate
   ```

## Monitoring and Maintenance

### Viewing Logs

To view logs for all services:
```bash
docker-compose logs -f
```

To view logs for a specific service:
```bash
docker-compose logs -f app
docker-compose logs -f mongo
docker-compose logs -f nginx
```

### Updating the Application

1. Pull the latest changes:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart services:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Backups

#### Database Backups

To create a backup of the MongoDB database:
```bash
docker-compose exec mongo mongodump --out /tmp/backup
docker cp farmmarket-mongo:/tmp/backup ./backup
```

To restore from a backup:
```bash
docker cp ./backup farmmarket-mongo:/tmp/backup
docker-compose exec mongo mongorestore /tmp/backup
```

#### Full System Backup

To create a complete backup of volumes and configuration:
```bash
docker-compose down
tar -czf backup-$(date +%Y%m%d).tar.gz ssl/ docker-compose.yml .env
docker-compose up -d
```

### Scaling

To scale the application for higher traffic:

1. Update the `docker-compose.yml` file to increase replicas:
   ```yaml
   services:
     app:
       deploy:
         replicas: 3
   ```

2. Add a load balancer if needed (nginx is already configured as a reverse proxy)

3. Consider using a managed database service for better performance and reliability

## Security Considerations

1. **Firewall Configuration**: Only expose necessary ports (80, 443)
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Regular Updates**: Keep Docker, host system, and dependencies updated

3. **Secrets Management**: Use environment variables or a secrets manager for sensitive data

4. **SSL/TLS**: Always use HTTPS in production

5. **Rate Limiting**: The nginx configuration includes rate limiting for API endpoints

6. **Security Headers**: The nginx configuration includes security headers

## Troubleshooting

### Common Issues

1. **Service fails to start**:
   - Check logs: `docker-compose logs [service]`
   - Verify environment variables
   - Check port conflicts

2. **Database connection issues**:
   - Verify MongoDB is running: `docker-compose ps mongo`
   - Check connection string in `.env`
   - Ensure network connectivity between services

3. **SSL certificate issues**:
   - Verify certificate paths in nginx.conf
   - Check certificate expiration
   - Ensure correct file permissions

4. **Payment processing issues**:
   - Verify Stripe keys in `.env`
   - Check Stripe webhook configuration
   - Verify webhook endpoint is accessible

### Health Checks

The application includes health check endpoints:

- Application health: `GET /health`
- Database health: `GET /api/health`

### Performance Monitoring

Consider adding monitoring tools:

- Prometheus and Grafana for metrics
- ELK stack for logging
- New Relic or Datadog for APM

## Domain Configuration

1. **DNS Settings**:
   - Configure A records to point to your server IP:
     ```
     A yourdomain.com 192.0.2.1
     A www.yourdomain.com 192.0.2.1
     ```

2. **Email Configuration**:
   - Configure SPF, DKIM, and DMARC records for email deliverability
   - Set up MX records if using custom email domain

## Support

For deployment issues or questions:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Consult the project documentation
4. Open an issue on the GitHub repository