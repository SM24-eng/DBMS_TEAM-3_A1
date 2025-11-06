import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BookingFormProps {
  vehicleId: string;
  dailyRate: number;
  vehicleName: string;
}

export const BookingForm = ({ vehicleId, dailyRate, vehicleName }: BookingFormProps) => {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");
  const [drivingExperience, setDrivingExperience] = useState("");

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const calculateTotal = () => {
    return dailyRate * calculateDays();
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setCheckingAvailability(true);
    setIsAvailable(null);

    try {
      const { data, error } = await supabase
        .from('rentals')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .in('status', ['pending', 'confirmed'])
        .or(`and(start_date.lte.${format(endDate, 'yyyy-MM-dd')},end_date.gte.${format(startDate, 'yyyy-MM-dd')})`);

      if (error) throw error;

      if (data && data.length > 0) {
        setIsAvailable(false);
        toast.error("Vehicle not available for selected dates");
      } else {
        setIsAvailable(true);
        toast.success("Vehicle available! You can proceed with booking");
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error("Failed to check availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (!name || !phone || !address || !drivingLicense || !drivingExperience) {
      toast.error("Please fill in all customer details");
      return;
    }

    if (isAvailable === false) {
      toast.error("Vehicle not available for selected dates");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Please login to book a vehicle");
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Update profile with booking details
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          phone,
          address,
          driving_license: drivingLicense,
          driving_experience: drivingExperience
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create rental
      const { error } = await supabase
        .from('rentals')
        .insert({
          user_id: user.id,
          vehicle_id: vehicleId,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          total_amount: calculateTotal(),
          status: 'pending'
        });

      if (error) throw error;

      toast.success(`Successfully booked ${vehicleName}!`);
      navigate("/dashboard");
    } catch (error) {
      console.error('Error booking vehicle:', error);
      toast.error("Failed to book vehicle");
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

  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm space-y-6">
      <h3 className="text-xl font-semibold">Book This Vehicle</h3>
      
      <div className="space-y-4">
        <div className="space-y-4 border-b pb-4">
          <h4 className="font-medium">Customer Details</h4>
          
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your complete address"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="license">Driving License Number *</Label>
            <Input
              id="license"
              value={drivingLicense}
              onChange={(e) => setDrivingLicense(e.target.value)}
              placeholder="Enter your license number"
              required
            />
          </div>

          <div>
            <Label htmlFor="experience">Driving Experience *</Label>
            <Input
              id="experience"
              value={drivingExperience}
              onChange={(e) => setDrivingExperience(e.target.value)}
              placeholder="e.g., 5 years"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">End Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => !startDate || date < startDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {startDate && endDate && (
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{calculateDays()} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily Rate:</span>
              <span className="font-medium">{formatPrice(dailyRate)}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary flex items-center">
                  <IndianRupee className="h-5 w-5" />
                  {formatPrice(calculateTotal())}
                </span>
              </div>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={checkAvailability}
          disabled={!startDate || !endDate || checkingAvailability}
          variant="outline"
        >
          {checkingAvailability ? "Checking..." : "Check Availability"}
        </Button>

        {isAvailable !== null && (
          <div className={cn(
            "p-3 rounded-lg text-sm font-medium text-center",
            isAvailable ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          )}>
            {isAvailable ? "✓ Available for selected dates" : "✗ Not available for selected dates"}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleBooking}
          disabled={loading || !startDate || !endDate || isAvailable === false}
        >
          {loading ? "Booking..." : "Confirm Booking"}
        </Button>
      </div>
    </div>
  );
};
