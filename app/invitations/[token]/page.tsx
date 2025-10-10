"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { acceptInvitation } from "@/lib/supabase/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

interface InvitationData {
  id: string;
  site_id: string;
  invited_email: string;
  role: 'admin' | 'collaborator';
  expires_at: string;
  status: string;
  site_name?: string;
  inviter_email?: string;
}

export default function AcceptInvitationPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: authData } = await supabase.auth.getUser();
      setUser(authData.user);
    };

    const loadInvitation = async () => {
      try {
        // Get invitation details
        const { data: invitationData, error: invitationError } = await supabase
          .from('collaboration_invitations')
          .select('*')
          .eq('token', token)
          .eq('status', 'pending')
          .single();

        if (invitationError || !invitationData) {
          setMessage({ type: 'error', text: 'Invalid or expired invitation link.' });
          return;
        }

        // Check if expired
        if (new Date(invitationData.expires_at) < new Date()) {
          setMessage({ type: 'error', text: 'This invitation has expired.' });
          return;
        }

        // Get site name
        const { data: siteData } = await supabase
          .from('sites')
          .select('name')
          .eq('id', invitationData.site_id)
          .single();

        // Get inviter email from auth.users - this might not work directly
        // For now, we'll skip the inviter email
        setInvitation({
          ...invitationData,
          site_name: siteData?.name || 'Unknown Site',
          inviter_email: undefined
        });
      } catch (error) {
        console.error('Error loading invitation:', error);
        setMessage({ type: 'error', text: 'Failed to load invitation details.' });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    if (token) {
      loadInvitation();
    }
  }, [token, supabase]);

  const handleAcceptInvitation = async () => {
    if (!user || !invitation) {
      router.push(`/auth/login?invitation=${token}`);
      return;
    }

    // Check if the logged-in user's email matches the invitation
    if (user.email !== invitation.invited_email) {
      setMessage({ 
        type: 'error', 
        text: `This invitation is for ${invitation.invited_email}. Please log in with the correct email address.` 
      });
      return;
    }

    setIsAccepting(true);
    try {
      await acceptInvitation(token, user.id);
      setMessage({ 
        type: 'success', 
        text: `Successfully joined ${invitation.site_name} as ${invitation.role}!` 
      });
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setMessage({ 
        type: 'error', 
        text: (error as Error)?.message || 'Failed to accept invitation. Please try again.' 
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!invitation) return;

    try {
      await supabase
        .from('collaboration_invitations')
        .update({ status: 'declined' })
        .eq('token', token);

      setMessage({ type: 'info', text: 'Invitation declined.' });
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Error declining invitation:', error);
      setMessage({ type: 'error', text: 'Failed to decline invitation.' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin  h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100  flex items-center justify-center">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Collaboration Invitation</CardTitle>
          {invitation && (
            <CardDescription>
              You&apos;ve been invited to collaborate on <strong>{invitation.site_name}</strong>
              {invitation.inviter_email && ` by ${invitation.inviter_email}`}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {message && (
            <div className={`flex items-center gap-2 p-3  ${
              message.type === 'success' ? 'bg-green-50 text-green-700' :
              message.type === 'error' ? 'bg-red-50 text-red-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
              {message.type === 'error' && <XCircle className="h-4 w-4" />}
              {message.type === 'info' && <Clock className="h-4 w-4" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {invitation && !message && (
            <>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Role: <span className="font-medium capitalize">{invitation.role}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Email: <span className="font-medium">{invitation.invited_email}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>

              {!user && (
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    Please sign in to accept this invitation.
                  </p>
                  <Button
                    onClick={() => router.push(`/auth/login?invitation=${token}`)}
                    className="w-full"
                  >
                    Sign In to Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/auth/sign-up?invitation=${token}`)}
                    className="w-full"
                  >
                    Create Account
                  </Button>
                </div>
              )}

              {user && (
                <div className="space-y-3">
                  <Button
                    onClick={handleAcceptInvitation}
                    disabled={isAccepting}
                    className="w-full"
                  >
                    {isAccepting ? (
                      <>
                        <div className="animate-spin  h-4 w-4 border-b-2 border-white mr-2"></div>
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Invitation
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDeclineInvitation}
                    disabled={isAccepting}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}
            </>
          )}

          {(!invitation && !isLoading) && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}