declare module '*/trash_talk.json' {
    interface Message {
        sender: string;
        content: string;
        type: string;
        created_at: string;
    }

    interface TrashTalk {
        messages: Message[];
    }

    const value: TrashTalk;
    export default value;
} 