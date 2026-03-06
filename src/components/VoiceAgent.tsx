import { useState, useCallback, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TripFormData } from '@/types/travel';

interface VoiceAgentProps {
  onTripDetailsSubmitted: (formData: TripFormData) => void;
  onClose: () => void;
}

interface TranscriptEntry {
  role: 'user' | 'agent';
  text: string;
}

export function VoiceAgent({ onTripDetailsSubmitted, onClose }: VoiceAgentProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    clientTools: {
      submit_trip_details: (params: Record<string, any>) => {
        console.log('[VOICE AGENT] submit_trip_details called with params:', JSON.stringify(params, null, 2));
        console.log('[VOICE AGENT] Raw startDate:', params.startDate, '| Raw endDate:', params.endDate);
        console.log('[VOICE AGENT] Raw origin:', params.origin, '| Raw destination:', params.destination);

        // Validate required fields before proceeding
        if (!params.origin || !params.destination || !params.startDate || !params.endDate) {
          console.error('[VOICE AGENT] Missing required fields:', {
            origin: params.origin,
            destination: params.destination,
            startDate: params.startDate,
            endDate: params.endDate,
          });
          toast({
            title: 'Incomplete Trip Details',
            description: 'The voice agent did not provide all required details (origin, destination, dates). Please try again.',
            variant: 'destructive',
          });
          return 'Missing required trip details. Please ask the user again for their origin, destination, start date, and end date.';
        }

        const formData: TripFormData = {
          origin: String(params.origin),
          destination: String(params.destination),
          startDate: String(params.startDate) as any,
          endDate: String(params.endDate) as any,
          budget: params.budget ? String(params.budget) : '2000',
          travelers: params.travelers ? String(params.travelers) : '1',
          interests: params.interests ? String(params.interests) : '',
        };

        console.log('[VOICE AGENT] Constructed formData:', JSON.stringify(formData, null, 2));

        toast({
          title: 'Trip Details Collected!',
          description: `Planning your trip to ${formData.destination}...`,
        });

        onTripDetailsSubmitted(formData);
        return 'Trip details submitted successfully. The itinerary is being generated.';
      },
    },
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
    },
    onMessage: (message: any) => {
      if (message.type === 'user_transcript') {
        const userText = message.user_transcription_event?.user_transcript;
        if (userText) {
          setTranscript(prev => [...prev, { role: 'user', text: userText }]);
        }
      } else if (message.type === 'agent_response') {
        const agentText = message.agent_response_event?.agent_response;
        if (agentText) {
          setTranscript(prev => [...prev, { role: 'agent', text: agentText }]);
        }
      }
    },
    onError: (error) => {
      console.error('Voice agent error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to voice agent. Please try again.',
        variant: 'destructive',
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // CRITICAL: getUserMedia must be called directly in click handler
      await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (micError) {
      console.error('Microphone access error:', micError);
      setIsConnecting(false);
      toast({
        title: 'Microphone Access Required',
        description: 'Please enable microphone access to use voice planning.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token');

      if (error || !data?.token) {
        throw new Error('Failed to get conversation token');
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to voice agent. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    onClose();
  }, [conversation, onClose]);

  const isConnected = conversation.status === 'connected';

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-6 space-y-4">
        {/* Status & Visualizer */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className={`relative w-24 h-24 rounded-full flex items-center justify-center ${
              isConnected
                ? 'bg-primary/10'
                : 'bg-muted'
            }`}
            animate={
              isConnected && conversation.isSpeaking
                ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }
                : {}
            }
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {isConnected && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
            {isConnected ? (
              conversation.isSpeaking ? (
                <Volume2 className="w-10 h-10 text-primary" />
              ) : (
                <Mic className="w-10 h-10 text-primary animate-pulse" />
              )
            ) : (
              <MicOff className="w-10 h-10 text-muted-foreground" />
            )}
          </motion.div>

          <p className="text-sm font-medium text-muted-foreground">
            {isConnecting
              ? 'Connecting to your travel agent...'
              : isConnected
              ? conversation.isSpeaking
                ? 'Agent is speaking...'
                : 'Listening to you...'
              : 'Start a conversation with your AI travel agent'}
          </p>
        </div>

        {/* Transcript */}
        {transcript.length > 0 && (
          <div
            ref={scrollRef}
            className="max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg bg-muted/50"
          >
            <AnimatePresence>
              {transcript.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm ${
                    entry.role === 'user'
                      ? 'text-right text-foreground'
                      : 'text-left text-muted-foreground'
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-1.5 rounded-xl max-w-[85%] ${
                      entry.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    }`}
                  >
                    {entry.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isConnected ? (
            <Button
              size="lg"
              onClick={startConversation}
              disabled={isConnecting}
              className="gap-2"
            >
              <Phone className="w-5 h-5" />
              {isConnecting ? 'Connecting...' : 'Start Voice Agent'}
            </Button>
          ) : (
            <Button
              size="lg"
              variant="destructive"
              onClick={endConversation}
              className="gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              End Conversation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
