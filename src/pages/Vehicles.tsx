import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Search, Filter, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  status: string;
  image_url: string | null;
  description: string | null;
  vehicle_type: string | null;
}

const Vehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<number[]>([0, 50000]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [availableVehicles, setAvailableVehicles] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (error) {
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setCheckingAvailability(true);

    try {
      const { data, error } = await supabase
        .from('rentals')
        .select('vehicle_id')
        .in('status', ['pending', 'confirmed'])
        .or(`and(start_date.lte.${format(endDate, 'yyyy-MM-dd')},end_date.gte.${format(startDate, 'yyyy-MM-dd')})`);

      if (error) throw error;

      const bookedVehicleIds = data?.map(rental => rental.vehicle_id) || [];
      const available = vehicles
        .filter(v => !bookedVehicleIds.includes(v.id))
        .map(v => v.id);
      
      setAvailableVehicles(available);
      toast.success(`${available.length} vehicles available for selected dates`);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error("Failed to check availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const getVehicleType = (brand: string): string => {
    const bikes = ['Royal Enfield', 'Harley Davidson', 'Yamaha', 'KTM'];
    const sports = ['Ferrari', 'Lamborghini', 'Porsche'];
    const luxury = ['BMW', 'Audi'];
    
    if (bikes.includes(brand)) return 'bike';
    if (sports.includes(brand)) return 'sports';
    if (luxury.includes(brand)) return 'luxury';
    return 'sedan';
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const vehicleType = getVehicleType(vehicle.brand);
    const matchesType = selectedType === "all" || vehicleType === selectedType;
    
    const matchesBrand = selectedBrand === "all" || vehicle.brand === selectedBrand;
    
    const matchesPrice = vehicle.daily_rate >= priceRange[0] && vehicle.daily_rate <= priceRange[1];
    
    const matchesAvailability = !startDate || !endDate || availableVehicles.length === 0 || availableVehicles.includes(vehicle.id);
    
    return matchesSearch && matchesType && matchesBrand && matchesPrice && matchesAvailability;
  });

  const uniqueBrands = Array.from(new Set(vehicles.map(v => v.brand))).sort();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-8">Available Vehicles</h1>
          
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card p-6 rounded-lg border shadow-sm sticky top-24 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Filters</h2>
                </div>

                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Brand or model..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Vehicle Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="bike">Bikes</SelectItem>
                      <SelectItem value="sedan">Sedans</SelectItem>
                      <SelectItem value="sports">Sports Cars</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Brand</label>
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {uniqueBrands.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Daily Rate: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </label>
                  <Slider
                    min={0}
                    max={50000}
                    step={500}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-2"
                  />
                </div>

                {/* Availability Check */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-2 block">Check Availability</label>
                  <div className="space-y-3">
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
                          {startDate ? format(startDate, "PPP") : "Start date"}
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
                          {endDate ? format(endDate, "PPP") : "End date"}
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

                    <Button
                      onClick={checkAvailability}
                      disabled={!startDate || !endDate || checkingAvailability}
                      className="w-full"
                    >
                      {checkingAvailability ? "Checking..." : "Check Availability"}
                    </Button>

                    {availableVehicles.length > 0 && (
                      <p className="text-sm text-center text-muted-foreground">
                        Showing {filteredVehicles.length} available vehicles
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedType("all");
                    setSelectedBrand("all");
                    setPriceRange([0, 50000]);
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setAvailableVehicles([]);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* Vehicle Grid */}
            <div className="lg:col-span-3">
              {loading ? (
                <p className="text-center text-muted-foreground col-span-full">Loading vehicles...</p>
              ) : filteredVehicles.length === 0 ? (
                <p className="text-center text-muted-foreground col-span-full">No vehicles found matching your filters</p>
              ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="bg-card rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="aspect-video bg-muted overflow-hidden">
                        {vehicle.image_url && (
                          <img
                            src={vehicle.image_url}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                              {vehicle.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">Year: {vehicle.year}</span>
                          </div>
                          {vehicle.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{vehicle.description}</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <IndianRupee className="h-5 w-5 text-primary" />
                            <span className="text-2xl font-bold">{formatPrice(vehicle.daily_rate)}</span>
                            <span className="text-sm text-muted-foreground">/day</span>
                          </div>
                          <Button
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            disabled={vehicle.status !== 'available'}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Vehicles;
