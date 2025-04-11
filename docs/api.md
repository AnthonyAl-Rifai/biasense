# API Spec

## POST /analyze

### Request
```json
{
  "content": ["string"]
}
```

### Response
```ts
interface Annotation {
  text: string;
  category: "fallacy" | "bias" | "opinion" | "fact";
  subtype: string;
  explanation: string;
  severity: number;
}
```
