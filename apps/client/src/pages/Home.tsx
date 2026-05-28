import { useState, useEffect } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Code } from "../components/Code";

export default function Home() {
    const [serverMessage, setServerMessage] = useState<string>(
        "Connecting to backend...",
    );

    useEffect(() => {
        fetch("/api")
            .then((res) => res.json())
            .then((data) => setServerMessage(data.message))
            .catch((err) => {
                console.error(err);
                setServerMessage("Failed to connect to server ❌");
            });
    }, []);

}