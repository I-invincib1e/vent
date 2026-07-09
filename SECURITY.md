# Security Policy

## Reporting a Vulnerability

If you find a security issue in OpenVent — especially anything touching the compliance package
(`packages/openvent-compliance`: DNC checks, calling-window enforcement, consent/recording logic), the
Twilio media-stream bridge, or credential/session handling — please **do not open a public issue**.

Instead, report it privately via [GitHub Security Advisories](https://github.com/I-invincib1e/vent/security/advisories/new)
for this repo. That gives us a private thread to work the issue before any public disclosure.

Include, if you can:
- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- Affected version/commit.

## What to expect

- Acknowledgement within a few days.
- We'll work with you on a fix and a disclosure timeline before anything goes public.
- Credit in the fix's changelog entry / release notes, if you want it.

## Scope

This covers the OpenVent codebase itself (this repo). It does not cover the security of your own
self-hosted deployment configuration, your Twilio/Deepgram/ElevenLabs/LLM provider accounts, or third-party
dependencies (report those upstream) — though we'll gladly help triage which side an issue is on.
