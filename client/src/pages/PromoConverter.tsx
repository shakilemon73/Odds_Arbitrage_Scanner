import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Plus, Trash2, DollarSign, Percent, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Promo, PromoType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function PromoConverter() {
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    bookmaker: "",
    type: "deposit_bonus" as PromoType,
    value: "",
    expiryDate: "",
    notes: "",
  });

  const { data: promos, isLoading } = useQuery<Promo[]>({
    queryKey: ["/api/promos"],
  });

  const addPromoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/promos", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promos"] });
      setIsAdding(false);
      setFormData({
        bookmaker: "",
        type: "deposit_bonus",
        value: "",
        expiryDate: "",
        notes: "",
      });
      toast({
        title: "Promo added",
        description: "Your promo has been saved successfully",
      });
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/promos/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promos"] });
      toast({
        title: "Promo deleted",
        description: "Promo has been removed successfully",
      });
    },
  });

  const calculatePromoValue = (promo: Promo): string => {
    switch (promo.type) {
      case "deposit_bonus":
        return `Match ${promo.value}%`;
      case "free_bet":
        return `$${promo.value} Free Bet`;
      case "odds_boost":
        return `+${promo.value}% Boost`;
      case "risk_free":
        return `$${promo.value} Risk Free`;
      default:
        return `$${promo.value}`;
    }
  };

  const getPromoTypeLabel = (type: PromoType): string => {
    const labels: Record<PromoType, string> = {
      deposit_bonus: "Deposit Bonus",
      free_bet: "Free Bet",
      odds_boost: "Odds Boost",
      risk_free: "Risk Free",
      other: "Other",
    };
    return labels[type];
  };

  const handleSubmit = () => {
    if (!formData.bookmaker || !formData.value) {
      toast({
        title: "Missing fields",
        description: "Please fill in bookmaker and value",
        variant: "destructive",
      });
      return;
    }

    addPromoMutation.mutate({
      ...formData,
      value: parseFloat(formData.value),
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="heading-promo-converter">
            Promo Converter
          </h1>
          <p className="text-muted-foreground mt-1">Track and convert sportsbook promotions</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} data-testid="button-add-promo">
            <Plus className="h-4 w-4 mr-2" />
            Add Promo
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Promo</CardTitle>
            <CardDescription>Enter promo details to track and calculate value</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bookmaker">Bookmaker</Label>
                <Input
                  id="bookmaker"
                  placeholder="e.g., DraftKings"
                  value={formData.bookmaker}
                  onChange={(e) => setFormData({ ...formData, bookmaker: e.target.value })}
                  data-testid="input-bookmaker"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Promo Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: PromoType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type" data-testid="select-promo-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit_bonus">Deposit Bonus</SelectItem>
                    <SelectItem value="free_bet">Free Bet</SelectItem>
                    <SelectItem value="odds_boost">Odds Boost</SelectItem>
                    <SelectItem value="risk_free">Risk Free</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value ({formData.type === "deposit_bonus" || formData.type === "odds_boost" ? "%" : "$"})</Label>
                <Input
                  id="value"
                  type="number"
                  placeholder="100"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  data-testid="input-value"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date (Optional)</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  data-testid="input-expiry"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional details about this promo..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="textarea-notes"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSubmit} data-testid="button-save-promo" disabled={addPromoMutation.isPending}>
                {addPromoMutation.isPending ? "Saving..." : "Save Promo"}
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)} data-testid="button-cancel">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {!promos || promos.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No promos tracked yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first promo to start tracking and calculating value
              </p>
            </CardContent>
          </Card>
        ) : (
          promos.map((promo) => (
            <Card key={promo.id} className="hover-elevate" data-testid={`card-promo-${promo.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      {promo.bookmaker}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {getPromoTypeLabel(promo.type)}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="gap-1.5">
                    {promo.type === "deposit_bonus" || promo.type === "odds_boost" ? (
                      <Percent className="h-3 w-3" />
                    ) : (
                      <DollarSign className="h-3 w-3" />
                    )}
                    {calculatePromoValue(promo)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {promo.expiryDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Expires: {new Date(promo.expiryDate).toLocaleDateString()}
                  </div>
                )}

                {promo.notes && (
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">
                    {promo.notes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Added {new Date(promo.timestamp).toLocaleDateString()}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deletePromoMutation.mutate(promo.id)}
                    data-testid={`button-delete-promo-${promo.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
