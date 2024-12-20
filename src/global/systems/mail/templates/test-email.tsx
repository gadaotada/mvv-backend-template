import React from "react";
import { Button, Html } from "@react-email/components";

export default function TestEmail({name = 'World'}: {name?: string}) {
  return (
    <Html>
      <Button
        href="https://example.com"
        style={{ background: "#000", color: "#fff", padding: "12px 20px" }}
      >
        Click me {name} !
      </Button>
    </Html>
  );
}
