import React, { useState, useEffect } from "react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Code } from "../components/Code";

export default function HomePage() {
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

  return (
    <div className="container">
      <div className="card">
        <h1>Workspot-Hanoi</h1>
        <p>Full-stack Turborepo template.</p>
        <p>
          Start by editing <Code>src/pages/HomePage.tsx</Code>
        </p>
        <Button appName="Workspot Hanoi" className="primary-button">
          Get Started
        </Button>
      </div>

      <Card className="card" title="Backend API" href="/api">
        {serverMessage}
      </Card>
    </div>
  );
}
