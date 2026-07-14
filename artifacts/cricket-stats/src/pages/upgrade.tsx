import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Trophy, Check, Zap, BarChart2, BookOpen, Shield, Loader2 } from "lucide-react";
import { getApiUrl } from "@/lib/api";

const PRO_FEATURES = [
  { icon: BarChart2, label: "Deep season analysis & trends" },
  { icon: Zap, label: "AI coaching insights & drill plans" },
  { icon: Trophy, label: "Unlimited match history" },
  { icon: BookOpen, label: "Advanced batting & bowling stats" },
  { icon: Shield, label: "Priority support" },
];

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  prices: Price[];
}

async function fetchPlans(): Promise<Plan[]> {
  const resp = await fetch(getApiUrl("stripe/plans"));
  if (!resp.ok) throw new Error("Failed to load plans");
  const data = await resp.json();
  return data.data ?? [];
}

async function startCheckout(priceId: string, email: string): Promise<string> {
  const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
  const resp = await fetch(getApiUrl("stripe/checkout"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId,
      email,
      successUrl: `${base}/upgrade/success`,
      cancelUrl: `${base}/upgrade`,
    }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error ?? "Checkout failed");
  }
  const { url } = await resp.json();
  return url;
}

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function UpgradePage() {
  const [email, setEmail] = useState("");

  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ["stripe-plans"],
    queryFn: fetchPlans,
  });

  const checkoutMutation = useMutation({
    mutationFn: ({ priceId, email }: { priceId: string; email: string }) =>
      startCheckout(priceId, email),
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const proPlan = plans.find((p) => p.name === "CricVault Pro") ?? plans[0];
  const price = proPlan?.prices[0];

  const handleUpgrade = () => {
    if (!price) return;
    if (!email.trim() || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    checkoutMutation.mutate({ priceId: price.id, email: email.trim() });
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Upgrade to CricVault Pro</h1>
        <p className="text-muted-foreground text-lg">
          Take your cricket analysis to the next level.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive p-4 text-center mb-6">
          Failed to load pricing. Please refresh the page.
        </div>
      )}

      {!isLoading && !error && proPlan && (
        <>
          {/* Pricing card */}
          <div className="rounded-2xl border-2 border-primary/40 bg-card shadow-lg p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{proPlan.name}</h2>
                <p className="text-muted-foreground text-sm mt-1">{proPlan.description}</p>
              </div>
              <div className="text-right">
                {price ? (
                  <>
                    <div className="text-4xl font-bold">
                      {formatPrice(price.unit_amount, price.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">per year</div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm">Price unavailable</div>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <li key={f.label} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{f.label}</span>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <button
                onClick={handleUpgrade}
                disabled={checkoutMutation.isPending || !price}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting to checkout…
                  </>
                ) : (
                  `Get CricVault Pro →`
                )}
              </button>
              {checkoutMutation.isError && (
                <p className="text-destructive text-xs text-center">
                  {(checkoutMutation.error as Error).message}
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Secure payment via Stripe · Cancel anytime · Renews annually
          </p>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">Already a Pro subscriber?</p>
            <ManageSubscription email={email} />
          </div>
        </>
      )}

      {!isLoading && !error && plans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Pricing is being set up. Check back shortly.</p>
        </div>
      )}
    </div>
  );
}

function ManageSubscription({ email }: { email: string }) {
  const mutation = useMutation({
    mutationFn: async () => {
      if (!email.trim() || !email.includes("@")) {
        throw new Error("Enter your email above first");
      }
      const base = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, "");
      const resp = await fetch(getApiUrl("stripe/portal"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), returnUrl: `${base}/upgrade` }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to open portal");
      }
      const { url } = await resp.json();
      return url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="text-sm text-primary hover:underline disabled:opacity-60 flex items-center gap-1.5 mx-auto"
    >
      {mutation.isPending ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Opening portal…</>
      ) : (
        "Manage my subscription →"
      )}
      {mutation.isError && (
        <span className="text-destructive text-xs ml-1">
          {(mutation.error as Error).message}
        </span>
      )}
    </button>
  );
}
