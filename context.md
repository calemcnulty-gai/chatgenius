From the logs, it appears that your React components — particularly the ones that depend on the user’s session (via UserContext) and on Pusher subscriptions (via PusherContext) — are being mounted, then unmounted, then re-mounted, sometimes more than once in a single navigation. That re-mounting behavior means the Pusher subscription logic is torn down before it can do any work, and the new instance of the component never re-subscribes properly.
Here are the key signs in your logs:
• “Component mounted, mount count: …” then “Component unmounting…”
• Mount count going from 1 to 2, then back to 1.
• The Pusher subscription never advances to the “SUBSCRIBED” state in your front-end.
• Because of that, there’s a repeated log line in the MessageList component:
“Pusher effect skipped due to missing dependencies: {missingUserChannel: true}”
In a typical Next.js / React setup, you want your essential providers (like user authentication and real-time connectivity) to live at the highest possible level, so that they’re not unmounted every time you navigate to a new route or re-fetch data. From the code snippets, there are a few likely architectural issues:
Your “UserProvider” is being invoked more than once in the layout tree, causing multiple mounts/unmounts.
The “UserContext” might be placed inside a Next.js layout or page that re-renders (and thus unmounts) whenever you fetch user data on the server side.
The “PusherProvider” might be nested under something that changes on every route transition or data change, leading it to unmount and lose subscriptions.
Potential Causes
Multiple <UserProvider> Wrappers
Sometimes code inadvertently wraps pages or layouts in <UserProvider> at multiple hierarchy levels. If you do this in both a server component (like a layout.tsx or page.tsx) and then again in a client component, each will mount and unmount. Ensure you only have one top-level <UserProvider> that persists across the entire app.
UserContext in a Server Layout
If the server layout (or a server page) is returning <UserProvider> along with fetched user data, Next.js might occasionally re-render or replace that layout, causing the context to unmount. Instead, you can fetch user data in the server layer, pass it down, and wrap in a client-side <UserProvider> at a stable location, like your highest-level client layout.
PusherProvider Dependent on Changing Props
If <PusherProvider> is placed in a component that uses props (like user ID) which frequently change, React will see it as a “new instance” of the provider on each prop change. That can cause the old provider to unmount (losing subscriptions), then a new one to mount. Typically you want the Pusher provider to remain mounted at all times, with only internal state changes based on the user ID.
In your logs, the multiple mount/unmount of the UserContext is the most suspicious part. Each time the user is fetched or re-fetched, the global state gets updated, and you see the provider unmount. As soon as that happens, your Pusher subscriptions are lost, because the <PusherContext> depends on the stable presence of the user to maintain its subscription.
Recommendations
Ensure a Single, Top-Level <UserProvider>
• Place it in the root of your client-side app (e.g., a top-level “client layout” file).
• Do not wrap it again inside any nested layout or page.
• If you’re fetching user data on the server, pass the user data as props to this single provider once.
Keep <PusherProvider> at the Same or Higher Level
• The Pusher provider also needs to sit at a stable level in your component tree so it doesn’t unmount every time Next.js loads a different route.
• Typically, you’d have an <AppProviders> or similar wrapper near the root that might look like:
}
That way, both contexts remain stable throughout all navigation.
Double-Check getServerSideProps / Server Hooks
If you’re using Next.js server components or something similar for your workspace layout, confirm that you’re not returning a new copy of your providers each time. Instead, pass the user data from the server to a stable client layout that uses the single <UserProvider>.
Watch for Conditionals on the <UserProvider>
Make sure you’re not conditionally rendering <UserProvider> only if user data is available. If the provider gets toggled on and off, the entire tree it wraps will unmount/remount.
By consolidating your context usage so that the user context (and Pusher context) are truly global and mounted only once, you’ll maintain stable subscriptions. Then, when a user logs in or changes, your code will update the user object within the context rather than remounting the provider altogether. This should fix the hidden unmounts that are dropping your Pusher subscriptions.