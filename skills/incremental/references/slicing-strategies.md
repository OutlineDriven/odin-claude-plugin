## Contract-First Slicing

When backend and frontend develop in parallel:

```
Slice 0:  Define the API contract (types, interfaces, OpenAPI spec)
Slice 1a: Implement backend against the contract + API tests
Slice 1b: Implement frontend against mock data matching the contract
Slice 2:  Integrate and test end-to-end
```

## Risk-First Slicing

Tackle the riskiest or most uncertain piece first:

```
Slice 1: Prove the WebSocket connection works (highest risk)
Slice 2: Build real-time updates on the proven connection
Slice 3: Add offline support and reconnection
```

If Slice 1 fails, you find out before investing in Slices 2 and 3.
