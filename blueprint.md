## Vercel Deployment

This project is configured for easy deployment to Vercel, a cloud platform for frontend frameworks and static sites.

### Steps to Deploy

1.  **Create a Vercel Account:** If you don't have one, sign up for a free account on the [Vercel website](https://vercel.com/).

2.  **Install Vercel CLI (Optional but Recommended):** For easier deployment and management from your terminal, install the Vercel CLI globally:

    
```
bash
    npm install -g vercel
    
```
3.  **Link Your Project (if using CLI):** Navigate to your project's root directory in your terminal and link it to your Vercel account:
```
bash
    vercel link
    
```
Follow the prompts to connect your local project to a new or existing Vercel project.

4.  **Deploy from the Vercel Dashboard:**

    *   Go to your [Vercel dashboard](https://vercel.com/dashboard).
    *   Click on "Add New..." and select "Project".
    *   Choose your Git provider (GitHub, GitLab, Bitbucket) and select the repository for this project.
    *   Vercel will automatically detect that it's a Next.js project and configure the build settings. You can review and adjust these settings if needed.
    *   Click "Deploy". Vercel will build and deploy your project.

5.  **Deploy from the Vercel CLI:**

    *   Navigate to your project's root directory in your terminal.
    *   Run the following command:

        
```
bash
        vercel
        
```
*   Vercel will build your project and provide a deployment URL.

### Environment Variables

If your project uses environment variables (e.g., for API keys, database connections), you need to add them to your Vercel project settings.

1.  Go to your Vercel project dashboard.
2.  Navigate to "Settings" > "Environment Variables".
3.  Add your environment variables with their corresponding values. Be sure to select the appropriate environments (e.g., Production, Preview, Development) where they should be available.

### Custom Domains

To use a custom domain for your deployed project:

1.  Go to your Vercel project dashboard.
2.  Navigate to "Settings" > "Domains".
3.  Enter your custom domain and follow the instructions to configure your DNS records.

### Automatic Deployments

By default, Vercel automatically deploys your project every time you push changes to the linked Git branch (usually `main` or `master`). You can configure this behavior in the project settings.