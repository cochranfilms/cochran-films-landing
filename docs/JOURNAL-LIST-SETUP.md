# Journal list

The journal form posts to `/api/contact/send-inquiry` with `source: "journal"`. Readers are stored in a separate Blob file, `journal/subscribers.json`. They are not added to the inquiry list.

## Vercel environment variables

Reuse the contact-form service. Add only these two:

```
EMAILJS_JOURNAL_TEMPLATE_ID=template_ughrezm
EMAILJS_JOURNAL_UNSUBSCRIBE_TEMPLATE_ID=template_nxgyqaa
```

Already set for the contact form, and reused here:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `BLOB_READ_WRITE_TOKEN`

Optional. If unset, unsubscribe links are signed with `EMAILJS_PRIVATE_KEY`:

```
JOURNAL_UNSUBSCRIBE_SECRET=
```

The GitHub Action that publishes an essay needs the same values as repository secrets, including `BLOB_READ_WRITE_TOKEN`.

## Templates

Both letters are already in the EmailJS account.

| Template | ID | Subject | To |
|----------|----|---------|----|
| Cochran Films Journal | `template_ughrezm` | `{{post_1_title}}` | `{{to_email}}` |
| Cochran Films Journal Unsubscribe | `template_nxgyqaa` | You're off the Cochran Films journal | `{{to_email}}` |

From name is Cochran Films. Reply-To is `info@cochranfilms.com`. From address uses the service default.

Source HTML is in `docs/emailjs-journal-issue-template.html` and `docs/emailjs-journal-unsubscribe-template.html`.

## Sending

A new signup gets the two newest live essays. Publishing the next queued essay is manual until a test letter looks right.

In GitHub, run the **Journal issue** workflow by hand. The Monday and Thursday schedule in `.github/workflows/journal-publish.yml` stays commented out until that test is accepted.

The same controls live in the studio admin at `/admin`, under Journal. From there you can see the queue, the reader list, add or remove a reader, copy the active addresses, send a test of the live issue, send that issue to readers who have not received it, and start the publisher.

Publishing from the dashboard needs one more Vercel variable, a GitHub token that can dispatch workflows on this repo:

```
JOURNAL_GITHUB_TOKEN=
```

Without it, the dashboard can still send the current letter. It cannot write the next essay onto the site.
