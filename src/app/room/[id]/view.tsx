"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import SkyBackground from "@/components/SkyBackground";

import TopBar from "@/components/room/TopBar";
import PlayersSidebar from "@/components/room/PlayersSidebar";
import ChatSidebar from "@/components/room/ChatSidebar";
import WaitingLobby from "@/components/room/WaitingLobby";
import GameArea from "@/components/room/GameArea";

import AuthBlock from "@/components/lobby/AuthBlock";
import { useRoomStore } from "@/store/roomStore";
import { useRouter } from "@bprogress/next";
import { playAudio } from "@/utils/audio";
import { NEXT_PUBLIC_SOCKET_URL } from "@/config/env";

export default function RoomView({ roomId }: { roomId: string }) {
  const router = useRouter();

  // App state from store
  const {
    user,
    setUser,
    gameStarted,
    setGameStarted,
    setWs,
    roomState,
    setRoomState,
    setChatMessages,
    setWordChoices,
    setCurrentWord,
    setRevealedWord,
    reset,
  } = useRoomStore();

  // Auth state
  const [authChecking, setAuthChecking] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [name, setName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    reset(); // Reset global store state on mount
    setAvatarSeed(Math.random().toString(36).substring(7));

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setAuthChecking(false);

      if (session) {
        setUser(session.user);
        if (session.user.user_metadata?.full_name) {
          setName(session.user.user_metadata.full_name);
        }
        if (session.user.user_metadata?.avatar_url) {
          const storedSeed =
            session.user.user_metadata.avatar_url.split("seed=")[1];
          if (storedSeed) setAvatarSeed(storedSeed);
        }
        // Authenticated users bypass the join confirmation modal
        setShowJoinModal(false);
      } else {
        const guestStr = localStorage.getItem("draw_guest_user");
        if (guestStr) {
          const guest = JSON.parse(guestStr);
          setName(guest.user_metadata?.full_name || "");
          if (guest.user_metadata?.avatar_url) {
            const storedSeed = guest.user_metadata.avatar_url.split("seed=")[1];
            if (storedSeed) setAvatarSeed(storedSeed);
          }
        }
        if (sessionStorage.getItem("previouslyConfirmed") !== "true") {
          setShowJoinModal(true);
        } else if (!guestStr) {
          setShowJoinModal(true); // Failsafe if they somehow have the flag but no guest data
        } else {
          setUser(JSON.parse(guestStr));
        }
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        if (_event === "SIGNED_IN") {
          sessionStorage.setItem("previouslyConfirmed", "true");
          setShowJoinModal(false);
        }
        if (currentUser.user_metadata?.full_name) {
          setName(currentUser.user_metadata.full_name);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // WebSocket Connection
  const userId = user?.id;
  const userName = user?.user_metadata?.full_name;
  const userAvatar = user?.user_metadata?.avatar_url;

  useEffect(() => {
    if (!userId || showJoinModal) return;

    const url = new URL(`${NEXT_PUBLIC_SOCKET_URL}/ws`);
    url.searchParams.append("roomId", roomId);
    url.searchParams.append("userId", userId);
    url.searchParams.append("name", userName || "");
    url.searchParams.append("avatar", userAvatar || "");

    const socket = new WebSocket(url.toString());

    socket.onopen = () => {
      console.log("Connected to room server!");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "room_state") {
        setRoomState(data.room);
        if (data.room.status === "playing") {
          setGameStarted(true);
        } else if (data.room.status === "finished") {
          setGameStarted(false); // Can show game over screen
        } else if (data.room.status === "waiting") {
          setGameStarted(false);
        }

        // When a new round starts, reset local words for guessers
        if (data.room.gameState?.phase === "choosing") {
          setRevealedWord("");
          setCurrentWord("");
        }
      } else if (data.type === "chat") {
        setChatMessages((prev) => [...prev, data]);
        if (data.userId === "system") {
          if (data.text.includes("joined the room!")) playAudio("join");
          else if (
            data.text.includes("left the room") ||
            data.text.includes("The drawer left!")
          )
            playAudio("leave");
          else if (data.text.includes("guessed the word!"))
            playAudio("correct_guess");
        }
      } else if (data.type === "choose_word") {
        setWordChoices(data.choices);
        setRevealedWord("");
      } else if (data.type === "you_are_drawing") {
        setCurrentWord(data.word);
        setRevealedWord("");
      } else if (data.type === "round_end") {
        setRevealedWord(data.word);
        playAudio("round_end");
      } else if (data.type === "hint_update") {
        setRevealedWord(data.hint);
      } else if (data.type === "room_closed" || data.type === "kicked") {
        router.push("/");
      }
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [userId, userName, userAvatar, showJoinModal, roomId]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/room/${roomId}` },
    });
    if (error) {
      console.error("Error logging in:", error);
      setGoogleLoading(false);
    }
  };

  const handlePlay = async () => {
    if (!name.trim()) return;
    setGuestLoading(true);
    const isGoogleAvatar =
      user &&
      !user.is_anonymous &&
      user.user_metadata?.avatar_url &&
      !user.user_metadata?.avatar_url.includes("dicebear");
    const finalAvatarUrl = isGoogleAvatar
      ? user?.user_metadata?.avatar_url
      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.auth.updateUser({
        data: { full_name: name.trim(), avatar_url: finalAvatarUrl },
      });
      sessionStorage.setItem("previouslyConfirmed", "true");
      setShowJoinModal(false);
      setGuestLoading(false);
      return;
    }

    let guestId = "guest-" + Math.random().toString(36).substring(2, 15);
    const existingGuestStr = localStorage.getItem("draw_guest_user");
    if (existingGuestStr) {
      try {
        const existingGuest = JSON.parse(existingGuestStr);
        if (existingGuest?.id) {
          guestId = existingGuest.id;
        }
      } catch {}
    }

    const fakeUser = {
      id: guestId,
      is_anonymous: true,
      user_metadata: {
        full_name: name.trim(),
        avatar_url: finalAvatarUrl,
      },
    };

    localStorage.setItem("draw_guest_user", JSON.stringify(fakeUser));
    setUser(fakeUser);
    setShowJoinModal(false);
    setGuestLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("draw_guest_user");
    setUser(null);
    setShowJoinModal(true);
  };

  const textStroke = {
    textShadow:
      "-2px -2px 0 #1f2937, 2px -2px 0 #1f2937, -2px 2px 0 #1f2937, 2px 2px 0 #1f2937, 0 4px 0 #1f2937",
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <SkyBackground />
        <p
          className="text-5xl font-black text-white animate-bounce relative z-10"
          style={textStroke}
        >
          LOADING...
        </p>
      </div>
    );
  }

  const isHost = roomState?.hostId === user?.id;
  const playerCount = roomState?.players?.length || 1;

  return (
    <div
      className={`${gameStarted ? "fixed inset-0" : "min-h-dvh overflow-x-hidden overflow-y-auto relative"} flex flex-col p-0 lg:p-6 gap-0 lg:gap-6 font-sans`}
    >
      <SkyBackground />

      {showJoinModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#1f2937]/80 backdrop-blur-sm">
          <AuthBlock
            user={user}
            name={name}
            setName={setName}
            avatarSeed={avatarSeed}
            setAvatarSeed={setAvatarSeed}
            handlePlay={handlePlay}
            handleGoogleLogin={handleGoogleLogin}
            handleLogout={handleLogout}
            guestLoading={guestLoading}
            googleLoading={googleLoading}
          />
        </div>
      )}

      <div className="hidden lg:block lg:p-0 shrink-0">
        <TopBar />
      </div>

      {/* Desktop Layout (hidden on mobile, visible on lg screens) */}
      <main
        className={`hidden lg:grid flex-1 grid-cols-4 grid-rows-1 gap-6 max-w-[1600px] w-full mx-auto ${gameStarted ? "min-h-0" : "min-h-[80vh] max-h-[80vh]"}`}
      >
        <div className={`col-span-1 ${gameStarted ? "h-full min-h-0" : ""}`}>
          <PlayersSidebar />
        </div>

        <div
          className={`col-span-2 flex flex-col ${gameStarted ? "h-full min-h-0" : ""}`}
        >
          {gameStarted ? (
            <GameArea />
          ) : (
            <WaitingLobby
              roomCode={roomId}
              isHost={isHost}
              playerCount={playerCount}
              minPlayers={2}
            />
          )}
        </div>

        <div className={`col-span-1 ${gameStarted ? "h-full min-h-0" : ""}`}>
          <ChatSidebar />
        </div>
      </main>

      {/* Mobile Layout (visible on small/medium screens, hidden on lg screens) */}
      <main
        className={`flex lg:hidden flex-col flex-1 w-full mx-auto ${gameStarted ? "min-h-0 overflow-hidden gap-0" : "gap-0"}`}
      >
        {/* Top: Canvas/Waiting Lobby */}
        <div
          className={`w-full flex flex-col ${gameStarted ? "flex-3 min-h-0" : "min-h-[40vh]"}`}
        >
          {gameStarted ? (
            <GameArea />
          ) : (
            <WaitingLobby
              roomCode={roomId}
              isHost={isHost}
              playerCount={playerCount}
              minPlayers={2}
            />
          )}
        </div>

        {/* Bottom: Players and Chat Side by Side */}
        <div
          className={`flex flex-row w-full ${gameStarted ? "flex-2 min-h-0 shrink-0 gap-0" : "h-[50dvh] min-h-100 gap-0"}`}
        >
          <div className="flex-1 w-1/2 h-full min-h-0">
            <PlayersSidebar />
          </div>
          <div className="flex-1 w-1/2 h-full min-h-0">
            <ChatSidebar />
          </div>
        </div>
      </main>
    </div>
  );
}
