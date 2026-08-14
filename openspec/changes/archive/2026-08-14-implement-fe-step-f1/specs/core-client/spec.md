## MODIFIED Requirements

### Requirement: Async errors surface as toasts

Root providers MUST report unhandled server-state query and mutation errors as user-visible toasts with a safe message (no raw stack traces). Those errors MUST NOT spam unhandled-rejection noise on an idle load of the app. A query MUST be able to opt out of this toast via an explicit skip flag on that query (`skipErrorToast` or equivalent). Mutations MUST still toast on error. Opt-out MUST NOT disable toasts globally.

#### Scenario: Query or mutation error

- **WHEN** a server-state query or mutation fails with a typed API or network error and the query has not opted out
- **THEN** a toast shows a safe message and the error does not appear as an unhandled rejection

#### Scenario: App load with providers

- **WHEN** the app loads with no failing query
- **THEN** the console has no unhandled-rejection noise from the provider setup

#### Scenario: Query opts out of error toast

- **WHEN** a query is marked to skip error toasts and that query fails
- **THEN** no error toast is shown for that failure; other queries and mutations still toast on error
