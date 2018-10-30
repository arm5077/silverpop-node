const util = require('util');
const request = require('request-promise-native');
const xml2js = require('xml2js');
const xmlParser = xml2js.parseString;
const xmlBuilder = new xml2js.Builder(); 
const cheerio = require('cheerio');
const moment = require('moment'); 

module.exports = {
  async connect(pod, client_id, client_secret, refresh_token) {
    const endpoint = `https://api${pod}.ibmmarketingcloud.com/oauth/token`;
    response = await request({
      method: 'POST',
      url: endpoint,  
      form: {
        grant_type: 'refresh_token',
        client_id,
        client_secret,
        refresh_token
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    }).catch((err) => {
      throw err;
    });

    const tokens = JSON.parse(response);
    
    return {
      tokens: tokens,
      xmlEndpoint: `https://api${pod}.silverpop.com/XMLAPI`,
      makeRequest: this.makeRequest,
      listContactLists: this.listContactLists,
      getMailingTemplates: this.getMailingTemplates,
      saveMailing: this.saveMailing,
      scheduleMailing: this.scheduleMailing
    }; 
  },
  
  async listContactLists(name){
    let xml = xmlBuilder.buildObject({
      Envelope: {
        Body: {
          GetLists: {
            VISIBILITY: 1,
            LIST_TYPE: 18
          }
        }
      }
    });

    result = await this.makeRequest(xml);
        

    result = result.LIST;
    
    if (name) {
      result = result.find(d => {
        return d.NAME == name;
      });
    }
    return result;
    
  },
  
  async makeRequest(xml){
    response = await request({
      method: 'POST',
      url: this.xmlEndpoint,  
      body: xml,  
      headers: {
        Authorization: 'Bearer ' + this.tokens.access_token,
        'Content-Type': 'text/xml;charset=UTF-8',
        'Content-Length': Buffer.byteLength(xml)
      }
    });
    result = await util.promisify(xmlParser)(response, { explicitArray: false });
    
    if (result.Envelope.Body.RESULT.SUCCESS === 'FALSE' || result.Envelope.Body.RESULT.SUCCESS === 'false') {
      throw result.Envelope.Body.Fault.FaultString;
    } 
    
    result = result.Envelope.Body.RESULT;
    return result;
  },
  
  async getMailingTemplates(opts) {
    console.log('looking up templates');
    let xml = xmlBuilder.buildObject({
      Envelope: {
        Body: {
          GetMailingTemplates: {
            VISIBILITY: opts.visibility || 1,
            LAST_MODIFIED_START_DATE: opts.last_modified_start_date || "",
            LAST_MODIFIED_END_DATE: opts.last_modified_end_date || ""
          }
        }
      }
    });
    
    result = await this.makeRequest(xml);
    
    result = result.MAILING_TEMPLATE;
    
    if (opts.name) {
      result = result.find(d => {
        return d.MAILING_NAME == opts.name;
      });
    }
    return result;
  },
  
  async saveMailing(opts) {
    
    if (!opts.MailingID) {
      const existingMailing = await this.getMailingTemplates({ name: "Andrew's test mailing"});
      if (existingMailing) {
        opts.MailingID = existingMailing.MAILING_ID;
      }
    }

    const ClickThrough = [];
    const $ = cheerio.load(opts.HTMLBody);
    $('a').each((i, elem) => {
      ClickThrough.push({
        ClickThroughName: $(elem).attr('name') || 'link' + Math.round(Math.random() * 1000),
        ClickThroughURL: $(elem).attr('href'),
        ClickThroughType: ($(elem).attr('href') == '#SPCUSTOMOPTOUT') ? 19 : 2
      })
    });
    
    let xml = xmlBuilder.buildObject({
      Envelope: {
        Body: {
          SaveMailing: {
            Header: {
              MailingName: opts.MailingName,
              MailingID: opts.MailingID || "",
              Subject: opts.Subject,
              ListID: opts.ListID,
              FromName: opts.FromName,
              FromAddress: opts.FromAddress,
              ReplyTo: opts.ReplyTo,
              Visibility: opts.Visibility || 1,
              FolderPath: opts.FolderPath || "",
              Encoding: opts.Encoding || 0,
              TrackingLevel: opts.TrackingLevel || 2,
              IsCrmTemplate: opts.IsCrmTemplate || false,
              HasSpCrmBlock: opts.HasSpCrmBlock || false,
              PersonalFromName: opts.PersonalFromName || "",
              PersonalFromAddress: opts.PersonalFromAddress || "",
              PersonalReplyTo: opts.PersonalReplyTo || ""
            },
            MessageBodies: {
              HTMLBody: opts.HTMLBody,
              TextBody: opts.TextBody || ""
            },
            ClickThroughs: {
              ClickThrough
            },
            ForwardToFriend: {
              ForwardType: 0
            }
          }
        }
      }
    });
    console.log(xml);
    let result = await this.makeRequest(xml)
      .catch((err) => {
        throw err;
      });
    
    return result;
  },
  
  async scheduleMailing(opts){
    const xml = xmlBuilder.buildObject({
      Envelope: {
        Body: {
          ScheduleMailing: {
            SEND_HTML: true, 
            TEMPLATE_ID: opts.TemplateID,
            LIST_ID: opts.ListID,
            MAILING_NAME: opts.MailingName,
            VISIBILITY: opts.Visibility || 1,
            SCHEDULED: opts.Scheduled || moment().add(1, 'minute').format('MM/DD/YYYY hh:mm:ss A')
          }
        }
      }
    });
  
    let result = await this.makeRequest(xml)
      .catch((err) => {
        console.log(err);
      });

    return result;
  }
};