# Personal Vault Platform

A platform online where I can store all my files.

The entire application (frontend and backend) is hosted on my Raspberry Pi at home. The storage is also set up on there as well (eventually S3).

## Tech Stack

Frontend: React/TypeScript

Backend: .NET 10

Services:

- Raspberry Pi (server)
- Storage: locally within Raspberry Pi for now (eventually migrate to S3 for more storage)

## Why I'm building this

I want a place where my family and I can access our communal files such as photos and videos.

It is going to be hosted fully within the network via Tailscale.

This application is built so that they don't have to SSH into the Raspberry Pi to access the files and get technical with anything.
