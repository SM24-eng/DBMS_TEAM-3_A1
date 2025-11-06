import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, Edit, Users, Car as CarIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Vehicle {
  id: string;
  registration_number: string;
  brand: string;
  model: string;
  year: number;
  daily_rate: number;
  status: string;
  image_url: string | null;
  description: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("rentals");
  
  // Form states
  const [regNumber, setRegNumber] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [status, setStatus] = useState("available");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!data) {
      toast.error("Access denied. Admin only.");
      navigate('/');
      return;
    }

    setIsAdmin(true);
    fetchVehicles();
    fetchUsers();
    fetchRentals();
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error("Failed to load users");
    }
  };

  const fetchRentals = async () => {
    try {
      // Fetch rentals with vehicles
      const { data: rentalsData, error: rentalsError } = await supabase
        .from('rentals')
        .select(`
          *,
          vehicles(brand, model, registration_number)
        `)
        .order('created_at', { ascending: false });

      if (rentalsError) throw rentalsError;

      // Fetch profiles for each unique user_id
      const userIds = [...new Set(rentalsData?.map(r => r.user_id) || [])];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, phone')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to rentals
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      const enrichedRentals = rentalsData?.map(rental => ({
        ...rental,
        profiles: profilesMap.get(rental.user_id) || null
      })) || [];

      setRentals(enrichedRentals);
    } catch (error: any) {
      console.error('Rentals fetch error:', error);
      toast.error("Failed to load rentals: " + (error.message || "Unknown error"));
    }
  };

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

  const resetForm = () => {
    setRegNumber("");
    setBrand("");
    setModel("");
    setYear("");
    setDailyRate("");
    setStatus("available");
    setImageUrl("");
    setDescription("");
    setEditingVehicle(null);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setRegNumber(vehicle.registration_number);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setYear(vehicle.year.toString());
    setDailyRate(vehicle.daily_rate.toString());
    setStatus(vehicle.status);
    setImageUrl(vehicle.image_url || "");
    setDescription(vehicle.description || "");
    setActiveTab("add");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const vehicleData = {
      registration_number: regNumber,
      brand,
      model,
      year: parseInt(year),
      daily_rate: parseFloat(dailyRate),
      status,
      image_url: imageUrl || null,
      description: description || null,
    };

    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id);

        if (error) throw error;
        toast.success("Vehicle updated successfully");
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([vehicleData]);

        if (error) throw error;
        toast.success("Vehicle added successfully");
      }

      resetForm();
      fetchVehicles();
    } catch (error: any) {
      toast.error(error.message || "Failed to save vehicle");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Vehicle deleted successfully");
      fetchVehicles();
    } catch (error) {
      toast.error("Failed to delete vehicle");
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-12">
        <div className="container">
          <h1 className="text-4xl font-bold mb-8">Admin Panel</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="rentals">
                <CarIcon className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="add">
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </TabsTrigger>
              <TabsTrigger value="manage">Manage Vehicles</TabsTrigger>
            </TabsList>

            <TabsContent value="rentals">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Vehicle Bookings</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentals.map((rental) => (
                      <TableRow key={rental.id}>
                        <TableCell className="font-mono text-xs">{rental.id.slice(0, 8)}</TableCell>
                        <TableCell>{rental.profiles?.name || 'N/A'}</TableCell>
                        <TableCell>{rental.profiles?.phone || 'N/A'}</TableCell>
                        <TableCell>
                          {rental.vehicles?.brand} {rental.vehicles?.model}<br />
                          <span className="text-xs text-muted-foreground">{rental.vehicles?.registration_number}</span>
                        </TableCell>
                        <TableCell>{new Date(rental.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(rental.end_date).toLocaleDateString()}</TableCell>
                        <TableCell>₹{rental.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            rental.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            rental.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {rental.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Registered Users</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Registered</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate">{user.address || 'N/A'}</TableCell>
                        <TableCell>{user.driving_license || 'N/A'}</TableCell>
                        <TableCell>{user.driving_experience || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>

            <TabsContent value="add">
              <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="regNumber">Registration Number</Label>
                      <Input
                        id="regNumber"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="dailyRate">Daily Rate (₹)</Label>
                      <Input
                        id="dailyRate"
                        type="number"
                        step="0.01"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="booked">Booked</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit">
                      {editingVehicle ? "Update Vehicle" : "Add Vehicle"}
                    </Button>
                    {editingVehicle && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="manage">
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {vehicle.brand} {vehicle.model}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.registration_number} • Year: {vehicle.year}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          ₹{vehicle.daily_rate}/day • Status: {vehicle.status}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(vehicle.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
