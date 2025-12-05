# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "Welcome back" [level=3] [ref=e10]
      - paragraph [ref=e11]: Sign in to your WealthPath account
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]:
          - text: Email
          - textbox "Email" [ref=e15]:
            - /placeholder: you@example.com
        - generic [ref=e16]:
          - text: Password
          - textbox "Password" [ref=e17]:
            - /placeholder: ••••••••
        - button "Sign in" [ref=e18] [cursor=pointer]
      - generic [ref=e23]: Or continue with
      - generic [ref=e24]:
        - button "Google" [ref=e25] [cursor=pointer]:
          - img
          - text: Google
        - button "Facebook" [ref=e26] [cursor=pointer]:
          - img
          - text: Facebook
      - paragraph [ref=e27]:
        - text: Don't have an account?
        - link "Sign up" [ref=e28] [cursor=pointer]:
          - /url: /register
  - region "Notifications (F8)":
    - list
  - alert [ref=e29]
```