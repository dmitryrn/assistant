components
- openai client
- tools executor class
- App service (for business logic, ties openai client, tools executor)

behaviors
1)
- i type in "set alarm for 8am, labeled architecture webinar"
- sends that to llm with a available tools
- llm executes a tool alarmSet(8am)
- tool executor sets alarm on my phone
- no llm response or chat history
- i see tool execution result (what tool, input, output, any other useful info if any about execution, like maybe Clock app's response code)
2)
- i type "set timer for 5 mins"
...
- tool executor sets timer on my phone
...
3)
- i type "remind me about architecture webinar at 6pm"
...
- tool executor creates a task with datetime via google tasks api
...
4)
- i type "start stopwatch"
...
- tool executor stops and starts a stopwatch via Clock app (idk if it's possible)
...

screens
- settings
  - setting api key, shoud be saved to some secure persistent storage, just openai for now
- main
  - text field to talk to llm
