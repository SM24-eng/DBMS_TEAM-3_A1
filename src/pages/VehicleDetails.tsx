import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { BookingForm } from "@/components/BookingForm";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  status: string;
  image_url: string | null;
  description: string | null;
  registration_number: string;
}

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicle();
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVehicle(data);
    } catch (error) {
      toast.error("Failed to load vehicle details");
      navigate('/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
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

  if (!vehicle) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-6">
                {vehicle.image_url && (
                  <img
                    src={vehicle.image_url}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  <div className="flex items-center gap-3">
                    <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                      {vehicle.status}
                    </Badge>
                    <span className="text-muted-foreground">Year: {vehicle.year}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <IndianRupee className="h-6 w-6 text-primary" />
                  <span className="text-3xl font-bold">{formatPrice(vehicle.daily_rate)}</span>
                  <span className="text-muted-foreground">/day</span>
                </div>

                {vehicle.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{vehicle.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-2">Vehicle Details</h3>
                  <p className="text-muted-foreground">
                    Registration: {vehicle.registration_number}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <BookingForm
                vehicleId={vehicle.id}
                dailyRate={vehicle.daily_rate}
                vehicleName={`${vehicle.brand} ${vehicle.model}`}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VehicleDetails;
