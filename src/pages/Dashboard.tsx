import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Rental {
  id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  vehicles: {
    brand: string;
    model: string;
    image_url: string | null;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUser(session.user);
    fetchRentals(session.user.id);
  };

  const fetchRentals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('rentals')
        .select(`
          *,
          vehicles (
            brand,
            model,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRentals(data || []);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (rentalId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      const { error } = await supabase
        .from('rentals')
        .update({ status: 'cancelled' })
        .eq('id', rentalId);

      if (error) throw error;

      toast.success("Booking cancelled successfully");
      if (user) fetchRentals(user.id);
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">Loading...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-8">My Bookings</h1>

          {rentals.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-xl text-muted-foreground mb-6">
                You haven't made any bookings yet.
              </p>
              <Button onClick={() => navigate('/vehicles')}>
                Browse Vehicles
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {rentals.map((rental) => (
                <Card key={rental.id} className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {rental.vehicles.image_url && (
                        <img
                          src={rental.vehicles.image_url}
                          alt={`${rental.vehicles.brand} ${rental.vehicles.model}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-semibold mb-2">
                            {rental.vehicles.brand} {rental.vehicles.model}
                          </h3>
                          <Badge variant={getStatusColor(rental.status)}>
                            {rental.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-1 text-2xl font-bold text-primary">
                            <IndianRupee className="h-5 w-5" />
                            {formatPrice(rental.total_amount)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Start: {formatDate(rental.start_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>End: {formatDate(rental.end_date)}</span>
                        </div>
                      </div>

                      {rental.status === 'pending' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancel(rental.id)}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
