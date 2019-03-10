# silverpop-node
A Node library for interacting with IBM's Silverpop email platform.

## Methods
### connect(pod, client\_id, client\_secret, refresh\_token)
Opens a connection to Silverpop using client credentials. You can get these from your user profile in Silverpop.

* `pod` - The pod your Silverpop instance lives on. 
* `client_id` - Your client ID, supplied by Silverpop. 
* `client_secret` - Your client secret, supplied by Silverpop.
* `refresh_token` - Your refresh token, supplied by Silverpop.

This method returns a `connection` object.

### connection.listContactLists([name])
Provides a list of all contact lists in your Silverpop instance, optionally filtered by a string.

* `name` (optional) - The name of the contact list you're searching for. Matches strictly.

### connection.getMailingTemplates([opts])
Searches for a mailing template (the draft emails you can send), optionally filtered by parameters.

* `opts.visibility`: Whether or not the searched-for mailing template is visible to all users. Defaults to `1`.
* `opts.last_modified_start_date`: The inclusive starting date the template was last edited, in `YYYY-MM-DD` format.
* `opts.last_modified_end_date`: The inclusive ending date the template was last edited, in `YYYY-MM-DD` format.

### connection.saveMailing(opts)
Accepts HTML, among other metadata, and updates the specified mailing template.

* `opts.MailingID` - The unique ID of the mailing template you're editing. Use a new ID to make a new mailing, or retrieve an existing mailing ID with with `connection.getMailingTemplates`.
* `opts.MailingName` - The name of the mailing template you're editing.
* `opts.Subject` - The subject of the email.
* `opts.HTMLBody` - The body of the email message.
* `opts.TextBody`(optional) - Optional text-only body for people who refuse to accept HTML email.  
* `FromName` - The display name of the sender of the email.
* `FromAddress` - The address that will be shown to the recipient as the sender of the email.
* `ReplyTo` - The email that will receive replies to the mailing.

### connection.scheduleMailing(opts)

Schedules a mailing to be sent. 

* `opts.TemplateID` - ID of the mailing template to be used. 
* `opts.ListID` - ID of the mailing list you want to send this email to. You can get this from `connection.listContactNames`.
* `opts.Scheduled` - The time and date to send the email, in `MM/DD/YYYY hh:mm:ss A` format. If excluded, email is sent immediately.