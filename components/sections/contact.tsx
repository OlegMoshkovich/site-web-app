'use client';

import * as React from 'react';
import { MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react';
import { toast } from 'sonner';

import { GridSection } from '@/components/marketing/fragments/grid-section';
import { SiteHeading } from '@/components/marketing/fragments/site-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function Contact(): React.JSX.Element {
  const [fullName, setFullName] = React.useState('');
  const [company, setCompany] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');

  const handleSendMessage = async (): Promise<void> => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'oleg.mosh@gmail.com',
          subject: `Message from ${fullName} at ${company}`,
          text: message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message.');
    }
  };

  return (
    <GridSection>
      <div className="container space-y-20 py-20">
        <SiteHeading
          badge="Kontakt"
          title={
            <>
              Ihr nächster schritt <br />
              beginnt hier
            </>
          }
        />
        <div className="lg:container lg:max-w-6xl ">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:gap-20">
            <div className="order-2 space-y-8 text-center lg:order-1 lg:w-1/2 lg:text-left">
              <h3 className="m-0 hidden max-w-fit text-4xl font-semibold lg:block">
                Lassen Sie uns gemeinsam etwas Großartiges schaffen
              </h3>
              <p className="text-muted-foreground lg:max-w-[80%]">
                Neugierig auf unser Lösungsangebot? Kontaktieren Sie uns, um
                eine Testversion anzufordern, unsere Funktionen zu entdecken
                oder zu besprechen, wie unsere Lösung für Ihr Unternehmen
                funktionieren kann.
              </p>
              <div className="space-y-4">
                <h4 className="hidden text-lg font-medium lg:block">
                  Kontaktdaten
                </h4>
                <div className="flex flex-col items-center gap-3 lg:items-start">
                  <ContactInfo
                    icon={PhoneIcon}
                    text="+49 157 55 15 53 10"
                  />
                  <ContactInfo
                    icon={MailIcon}
                    text="asse.boerties@cloneit.at"
                  />
                  <ContactInfo
                    icon={MapPinIcon}
                    text="TUM Venture Labs -
Arcisstraße 21 80333 München, DE"
                  />
                  <ContactInfo
                    icon={MapPinIcon}
                    text="clone:it GmbH - Am Katzelbach 7
8054 Graz, AT"
                  />
                </div>
              </div>
            </div>
            <Card className="order-1 mx-auto w-full max-w-lg shadow-lg lg:order-2 lg:w-1/2">
              <CardContent className="flex flex-col gap-6 p-6 lg:p-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 grid w-full items-center gap-1.5 sm:col-span-1">
                    <Label htmlFor="firstname">Vor- und Nachname </Label>
                    <Input
                      id="firstname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 grid w-full items-center gap-1.5 sm:col-span-1">
                    <Label htmlFor="lastname">Firma</Label>
                    <Input
                      id="lastname"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="message">Nachricht</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSendMessage}
                >
                  Nachricht senden
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </GridSection>
  );
}

type ContactInfoProps = {
  icon: React.ElementType;
  text: string;
};

function ContactInfo({
  icon: Icon,
  text
}: ContactInfoProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm lg:w-64">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
}
