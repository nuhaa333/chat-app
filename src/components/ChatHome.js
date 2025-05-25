
// src/pages/ChatHome.jsx
import React, { useState, useEffect } from "react";
import ChatNavbar from "../components/ChatNavbar";
import { db } from "../firebase";
import {

collectionGroup,
getDocs,
query,
where,
} from "firebase/firestore";

const ChatHome = () => {
const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);

useEffect(() => {
    const doSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        // Search messages across all chatRooms
        const msgQuery = query(
            collectionGroup(db, "messages"),
            where("text", ">=", searchQuery),
            where("text", "<=", searchQuery + "\uf8ff")
        );

        const snapshot = await getDocs(msgQuery);
        const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setSearchResults(results);
    };

    const timeout = setTimeout(doSearch, 300); // debounce
    return () => clearTimeout(timeout);
}, [searchQuery]);

return (
    <>
        <ChatNavbar
            themeMode={"light"} // or from props
            toggleTheme={() => {}}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
        />

        {/* Render search results here if any */}
        {searchResults.length > 0 && (
            <div style={{ padding: 10 }}>
                <h4>Search Results</h4>
                {searchResults.map(msg => (
                    <div key={msg.id}>
                        <strong>{msg.senderDisplayName}</strong>: {msg.text}
                    </div>
                ))}
            </div>
        )}

        {/* ...rest of chat room list */}
    </>
);
};

export default ChatHome;
