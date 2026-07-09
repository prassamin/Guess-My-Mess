"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import SkyBackground from "@/components/SkyBackground";

import RoomModal from "@/components/lobby/RoomModal";
import Header from "@/components/lobby/Header";
import LogoBlock from "@/components/lobby/LogoBlock";
import AuthBlock from "@/components/lobby/AuthBlock";
import CreditBadge from "@/components/lobby/CreditBadge";
import { useAppStore } from "@/store/app-store";

export default function HomeView({ initialUser }: { initialUser: any }) {
  const [guestLoading, setGuestLoading] = useState(false);
  const { user, setUser } = useAppStore();
  const [isClient, setIsClient] = useState(false);

  // We use activeUser to gracefully handle localStorage guest users after hydration
  const activeUser = isClient ? user : initialUser;

  const [name, setName] = useState(initialUser?.user_metadata?.full_name || "");
  const [avatarSeed, setAvatarSeed] = useState("");

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [modalMode, setModalMode] = useState<"menu" | "create">("menu");

  useEffect(() => {
    setIsClient(true);
    setUser(initialUser);

    // Set seed logic
    let seedSet = false;
    if (initialUser?.user_metadata?.avatar_url) {
      const storedSeed = initialUser.user_metadata.avatar_url.split("seed=")[1];
      if (storedSeed) {
        setAvatarSeed(storedSeed);
        seedSet = true;
      }
    }

    // If no user from server, check guest
    if (!initialUser) {
      const guestStr = localStorage.getItem("draw_guest_user");
      if (guestStr) {
        const guest = JSON.parse(guestStr);
        setUser(guest);
        setName(guest.user_metadata.full_name);
        if (guest.user_metadata?.avatar_url) {
          const storedSeed = guest.user_metadata.avatar_url.split("seed=")[1];
          if (storedSeed) {
            setAvatarSeed(storedSeed);
            seedSet = true;
          }
        }
      }
    }

    if (!seedSet) {
      setAvatarSeed(Math.random().toString(36).substring(7));
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar")
          .eq("id", currentUser.id)
          .single();

        setUser({
          ...currentUser,
          username: profile?.username,
          avatar: profile?.avatar,
        });
        if (currentUser.user_metadata?.full_name) {
          setName(currentUser.user_metadata.full_name);
        }
      } else if (_event === "SIGNED_OUT") {
        const currentUserState = useAppStore.getState().user;
        setUser(currentUserState?.is_anonymous ? currentUserState : null);
      }
    });
    return () => subscription.unsubscribe();
  }, [initialUser]);

  const handlePlay = async () => {
    if (!name.trim()) return;
    setGuestLoading(true);

    const finalAvatarUrl =
      user?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

    const isGuest = !user || user.is_anonymous;

    if (!isGuest) {
      // For authenticated users, only update if something changed
      const currentName = user.user_metadata?.full_name;
      const currentAvatar = user.user_metadata?.avatar_url || user.avatar;
      
      if (name.trim() !== currentName || finalAvatarUrl !== currentAvatar) {
        await supabase.auth.updateUser({
          data: {
            full_name: name.trim(),
            avatar_url: finalAvatarUrl,
          },
        });
      }
    } else {
      // For guest users, update local state instantly without network requests
      const fakeUser = {
        id: user?.id || "guest-" + Math.random().toString(36).substring(2, 15),
        is_anonymous: true,
        user_metadata: {
          full_name: name.trim(),
          avatar_url: finalAvatarUrl,
        },
      };

      localStorage.setItem("draw_guest_user", JSON.stringify(fakeUser));
      setUser(fakeUser);
    }

    setGuestLoading(false);
    setModalMode("menu");
    setShowRoomModal(true);
  };

  return (
    <main className="min-h-screen lg:h-screen w-full overflow-x-hidden lg:overflow-hidden overflow-y-auto flex flex-col font-sans relative">
      <SkyBackground />

      <Header user={activeUser} />

      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-12 lg:gap-24 p-4 sm:p-6 pb-12 sm:pb-16 lg:p-10 min-h-0 relative z-10 w-full max-w-350 mx-auto">
        <LogoBlock
          user={activeUser}
          onPlayClick={() => {
            setModalMode("menu");
            setShowRoomModal(true);
          }}
        />

        <AuthBlock
          name={isClient ? name : (initialUser?.user_metadata?.full_name || "")}
          setName={setName}
          avatarSeed={isClient ? avatarSeed : ""}
          setAvatarSeed={setAvatarSeed}
          handlePlay={handlePlay}
          guestLoading={guestLoading}
          user={activeUser}
        />
      </div>

      <RoomModal
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        user={activeUser}
        initialMode={modalMode}
      />

      <CreditBadge />
    </main>
  );
}
