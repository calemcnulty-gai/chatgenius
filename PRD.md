### **Product Requirements Document (PRD) for ChatGenius MVP**

---

### **Project Overview**  
ChatGenius is a Slack-like real-time messaging app that incorporates AI tools to enhance team communication. It allows users to chat in channels, use AI for summarization, reply generation, and search, and provides admins with workspace and user management tools.

---

### **User Roles & Core Workflows**

#### **Regular Users**
1. Send and receive messages in real-time within channels.  
2. Use AI tools to summarize conversations, generate replies, and search past messages.  
3. Manage personal settings like notifications and profile preferences.  

#### **Admin Users**
4. Create and manage workspaces, channels, and user roles.  
5. Moderate channels and ensure proper access control.  
6. Monitor and configure AI usage limits for workspace members.  

---

### **Technical Foundation**

#### **Data Models**
1. **Users:** `id`, `name`, `email`, `role`, `profile_image`, `status`, `settings`, `created_at`, `updated_at`.  
2. **Workspaces:** `id`, `name`, `description`, `owner_id`, `created_at`, `updated_at`.  
3. **WorkspaceMemberships:** `id`, `workspace_id`, `user_id`, `role`, `created_at`, `updated_at`.  
4. **Channels:** `id`, `workspace_id`, `name`, `type`, `created_at`, `updated_at`.  
5. **Messages:** `id`, `channel_id`, `sender_id`, `content`, `ai_generated`, `attachments`, `timestamp`, `edited_at`.  
6. **AIInteractions:** `id`, `user_id`, `workspace_id`, `channel_id`, `type`, `input_text`, `output_text`, `timestamp`.  

#### **API Endpoints**
1. `POST /api/auth/login` - Authenticate user via Clerk.  
2. `GET /api/workspaces` - Fetch user’s workspaces.  
3. `POST /api/workspaces` - Create a new workspace.  
4. `GET /api/workspaces/:id/channels` - Fetch channels in a workspace.  
5. `POST /api/channels/:id/messages` - Send a message in a channel.  
6. `POST /api/ai/summarize` - Summarize a conversation thread.  

#### **Key Components**
1. **Workspace Dashboard:** Lists channels, users, and quick workspace actions.  
2. **Channel View:** Displays chat history with real-time updates and message input.  
3. **Message Input:** Allows users to send messages and trigger AI tools.  
4. **Admin Panel:** Provides tools for workspace, channel, and user management.  
5. **AIToolbar:** Offers AI features like summarization, reply generation, and search.

---

### **MVP Launch Requirements**

1. Implement user authentication and role management using Clerk.  
2. Build real-time messaging with WebSockets, allowing users to send and receive messages in channels.  
3. Develop AI-powered features (summarization, reply generation, and search) with OpenAI integration.  
4. Create workspace and channel management tools for admins.  
5. Provide a user-friendly interface with intuitive navigation for all roles.  
6. Ensure data persistence using Postgres with defined models and relationships.  
7. Set up robust authorization middleware to validate access by role and membership.  
8. Deploy the application with error handling, AI rate limits, and real-time updates.  

---

This PRD is focused on delivering a functional and scalable MVP for ChatGenius. Let me know if you'd like further details or refinements!