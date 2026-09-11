import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEcoStore, ClaimedVoucher } from '@/contexts/EcoContext';
import { Reward } from '@/lib/mockData';
import { 
  Gift,
  Star,
  CheckCircle,
  Clock,
  Tag,
  Zap,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Copy,
  Check,
  QrCode,
  Sparkles,
  Ticket,
  Store,
  ExternalLink,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

interface RewardsPageProps {
  onBack?: () => void;
}

export const RewardsPage = ({ onBack }: RewardsPageProps = {}) => {
  const { userProfile, vouchers, rewardsCatalog, redeemReward, useVoucher } = useEcoStore();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'wallet'>('catalog');
  const [newlyRedeemedVoucher, setNewlyRedeemedVoucher] = useState<ClaimedVoucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Coupon code copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmRedeem = () => {
    if (!selectedReward) return;

    const res = redeemReward(selectedReward);
    if (res.success && res.voucher) {
      setNewlyRedeemedVoucher(res.voucher);
      setSelectedReward(null);
      toast.success(`Redeemed ${res.voucher.title}! Points deducted.`);
    } else {
      toast.error(res.message || 'Redemption failed');
    }
  };

  const canAfford = (pointsCost: number) => userProfile.pointsBalance >= pointsCost;

  const activeVouchers = vouchers.filter(v => v.status === 'ACTIVE');
  const usedVouchers = vouchers.filter(v => v.status === 'USED');

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {onBack && (
          <div className="flex items-center">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        )}

        {/* Header & Live Balance Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-primary to-teal-700 text-white shadow-xl">
          <div className="space-y-1">
            <Badge className="bg-white/20 text-white border-none font-semibold mb-1">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Partner Eco-Rewards
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              EcoDrop Rewards Marketplace
            </h1>
            <p className="text-emerald-100 text-xs md:text-sm max-w-xl">
              Turn your recycled plastic, paper, e-waste, and glass into real discounts from your favorite local brands.
            </p>
          </div>

          {/* Points Pill Counter */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center min-w-[180px] self-stretch sm:self-auto">
            <span className="text-[11px] uppercase tracking-wider text-emerald-100 font-semibold block">
              Available Balance
            </span>
            <div className="text-3xl font-black text-amber-300 flex items-center justify-center gap-1.5 mt-0.5">
              <Zap className="h-6 w-6 text-amber-300 fill-amber-300" />
              {userProfile.pointsBalance}
              <span className="text-xs text-white font-normal">pts</span>
            </div>
            <span className="text-[10px] text-emerald-100 font-medium block mt-1">
              Tier: {userProfile.tier}
            </span>
          </div>
        </div>

        {/* Tabs: Catalog vs My Claimed Vouchers */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <TabsList className="grid grid-cols-2 w-full sm:w-80">
              <TabsTrigger value="catalog" className="flex items-center gap-1.5">
                <ShoppingBag className="h-4 w-4" /> Rewards Catalog
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-1.5">
                <Ticket className="h-4 w-4" /> My Vouchers ({activeVouchers.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: Rewards Catalog */}
          <TabsContent value="catalog" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {rewardsCatalog.map((reward) => {
                const affordable = canAfford(reward.pointsCost);
                const progressPct = Math.min(100, Math.round((userProfile.pointsBalance / reward.pointsCost) * 100));

                return (
                  <Card
                    key={reward.id}
                    className="shadow-card-eco border flex flex-col justify-between hover:border-primary/50 transition-all bg-card overflow-hidden"
                  >
                    <div>
                      <div className="h-28 bg-muted/30 border-b relative">
                        <img src={reward.image} alt={reward.name} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute top-2 right-2">
                        <Badge
                          variant={affordable ? 'default' : 'outline'}
                          className={`font-mono text-xs font-bold ${
                            affordable
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground border-muted-foreground/30'
                          }`}
                        >
                          {reward.pointsCost} pts
                        </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-2">
                        <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                          {reward.vendor}
                        </span>
                        <h3 className="font-bold text-sm text-foreground line-clamp-1">
                          {reward.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {reward.description}
                        </p>
                      </CardContent>
                    </div>

                    <div className="p-4 pt-0 space-y-3">
                      {!affordable && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                            <span>Progress</span>
                            <span>{userProfile.pointsBalance}/{reward.pointsCost} pts</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full text-xs h-9"
                        variant={affordable ? 'hero' : 'outline'}
                        disabled={!affordable}
                        onClick={() => setSelectedReward(reward)}
                      >
                        {affordable ? 'Redeem Voucher' : `Need ${reward.pointsCost - userProfile.pointsBalance} more pts`}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: My Claimed Vouchers Wallet */}
          <TabsContent value="wallet" className="space-y-6">
            {activeVouchers.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Active Vouchers Ready for Store Checkout ({activeVouchers.length})
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activeVouchers.map((voucher) => (
                    <Card key={voucher.id} className="shadow-lg border-2 border-primary/30 bg-card overflow-hidden">
                      <div className="bg-gradient-primary text-primary-foreground p-3.5 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <img src={voucher.image} alt="" className="h-10 w-10 rounded-md object-cover border border-white/20" />
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-primary-foreground/80 block">
                              {voucher.vendor}
                            </span>
                            <h4 className="font-bold text-sm text-primary-foreground line-clamp-1">
                              {voucher.title}
                            </h4>
                          </div>
                        </div>
                        <Badge className="bg-white/20 text-white border-none text-[10px]">
                          ACTIVE
                        </Badge>
                      </div>

                      <CardContent className="p-4 space-y-4">
                        <p className="text-xs text-muted-foreground">{voucher.description}</p>

                        {/* Barcode representation */}
                        <div className="p-3 bg-muted/40 rounded-xl border space-y-2 text-center">
                          <div className="h-8 w-full barcode-stripes opacity-90 rounded" />
                          <span className="text-[10px] font-mono text-muted-foreground block tracking-wider">
                            {voucher.barcodeValue}
                          </span>
                        </div>

                        {/* Coupon Code copy row */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20">
                          <span className="font-mono font-bold text-sm text-primary">{voucher.couponCode}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs font-semibold text-primary"
                            onClick={() => copyCode(voucher.couponCode)}
                          >
                            {copiedCode === voucher.couponCode ? (
                              <>
                                <Check className="h-3.5 w-3.5 mr-1" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                              </>
                            )}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-primary" />
                            Expires: {new Date(voucher.expiresAt).toLocaleDateString()}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              useVoucher(voucher.id);
                              toast.success('Voucher marked as used in store!');
                            }}
                          >
                            Mark Used
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-2xl p-8 space-y-3">
                <Ticket className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                <h3 className="font-bold text-base text-foreground">No Active Vouchers</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  You haven't claimed any rewards yet. Browse the catalog to redeem your points for coffee, discounts, and metro passes!
                </p>
                <Button size="sm" onClick={() => setActiveTab('catalog')}>
                  Browse Rewards Catalog
                </Button>
              </div>
            )}

            {usedVouchers.length > 0 && (
              <div className="space-y-3 pt-6 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Previously Used Vouchers ({usedVouchers.length})
                </h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {usedVouchers.map((v) => (
                    <div key={v.id} className="p-3 rounded-xl border bg-muted/20 opacity-60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold block">{v.title}</span>
                        <span className="text-[10px] text-muted-foreground">{v.vendor} • {v.couponCode}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">USED</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Confirmation Modal to Redeem Reward */}
        {selectedReward && (
          <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
            <DialogContent className="max-w-md p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" /> Confirm Reward Redemption
                </DialogTitle>
                <DialogDescription>
                  This will deduct {selectedReward.pointsCost} points from your balance.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 rounded-xl bg-muted/30 border space-y-2 text-sm my-2">
                <div className="flex items-center space-x-2">
                  <img src={selectedReward.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                  <div>
                    <h4 className="font-bold text-foreground">{selectedReward.name}</h4>
                    <p className="text-xs text-muted-foreground">{selectedReward.vendor}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t text-xs">
                  <span className="text-muted-foreground">Points to deduct:</span>
                  <span className="font-bold text-destructive">-{selectedReward.pointsCost} pts</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Remaining balance:</span>
                  <span className="font-bold text-primary">
                    {userProfile.pointsBalance - selectedReward.pointsCost} pts
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedReward(null)}>
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleConfirmRedeem}>
                  Confirm & Generate Voucher
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal showing newly claimed voucher pass */}
        {newlyRedeemedVoucher && (
          <Dialog open={!!newlyRedeemedVoucher} onOpenChange={() => setNewlyRedeemedVoucher(null)}>
            <DialogContent className="max-w-md p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-foreground">Voucher Claimed Successfully!</h3>
                <p className="text-xs text-muted-foreground">
                  Your coupon code is ready. You can present this barcode or code at checkout.
                </p>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
                <div className="h-10 w-full barcode-stripes opacity-90 rounded" />
                <span className="text-xs font-mono font-bold tracking-widest text-foreground block">
                  {newlyRedeemedVoucher.couponCode}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => copyCode(newlyRedeemedVoucher.couponCode)}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy Coupon Code
                </Button>
              </div>

              <Button
                variant="default"
                className="w-full"
                onClick={() => {
                  setNewlyRedeemedVoucher(null);
                  setActiveTab('wallet');
                }}
              >
                View in My Vouchers Wallet
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default RewardsPage;