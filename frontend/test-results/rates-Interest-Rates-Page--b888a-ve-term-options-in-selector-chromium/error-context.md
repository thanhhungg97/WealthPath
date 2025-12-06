# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "Create an account" [level=3] [ref=e10]
      - paragraph [ref=e11]: Start your journey to financial freedom
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - text: Name
          - textbox "Name" [ref=e15]:
            - /placeholder: John Doe
            - text: Test User
        - generic [ref=e16]:
          - text: Email
          - textbox "Email" [ref=e17]:
            - /placeholder: you@example.com
            - text: test+1764993707707@example.com
        - generic [ref=e18]:
          - text: Password
          - textbox "Password" [ref=e19]:
            - /placeholder: ••••••••
            - text: testpassword123
        - button "Create account" [ref=e20] [cursor=pointer]
      - paragraph [ref=e21]:
        - text: Already have an account?
        - link "Sign in" [ref=e22] [cursor=pointer]:
          - /url: /login
  - region "Notifications (F8)":
    - list
  - alert [ref=e23]
```