
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { deleteVehicle } from "@/services/actions";
import { getVehicles as getVehiclesFromService, type Vehicle } from "@/services/vehicleService";
import { Edit, Loader2, MoreHorizontal, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { VehicleSheet } from "./AddVehicleSheet"; // Re-using for add/edit
import { DeleteVehicleDialog } from "./DeleteVehicleDialog";

export function VehicleList() {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);


    useEffect(() => {
        if (user) {
            setLoading(true);
            const unsubscribe = getVehiclesFromService(user.uid, (data) => {
                setVehicles(data);
                setLoading(false);
            });
            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleAddClick = () => {
        setSelectedVehicle(null);
        setIsSheetOpen(true);
    };

    const handleEditClick = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setIsSheetOpen(true);
    };

    const handleDeleteClick = (vehicle: Vehicle) => {
        setVehicleToDelete(vehicle);
        setIsDialogOpen(true);
    }

    const confirmDelete = async () => {
        if (!user || !vehicleToDelete) return;
        try {
            await deleteVehicle(user.uid, vehicleToDelete.id);
            toast({
                title: "Vehicle Deleted",
                description: `${vehicleToDelete.name} has been successfully deleted.`
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete vehicle."
            });
        } finally {
            setIsDialogOpen(false);
            setVehicleToDelete(null);
        }
    }

    return (
        <>
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{t.vehicles}</CardTitle>
                        <CardDescription>A list of all vehicles in your fleet.</CardDescription>
                    </div>
                     <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            {t.addVehicle}
                        </span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : vehicles.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No vehicles found. Add your first one!</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Driver Name</TableHead>
                                <TableHead>Driver NID</TableHead>
                                <TableHead>Driver Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.map((vehicle) => (
                                <TableRow key={vehicle.id}>
                                    <TableCell className="font-medium">{vehicle.name}</TableCell>
                                    <TableCell>{vehicle.plateNumber}</TableCell>
                                    <TableCell>{vehicle.driverPhone || "N/A"}</TableCell>
                                    <TableCell>
                                        <Badge variant={
                                            vehicle.status === 'Active' ? 'default' :
                                            vehicle.status === 'Maintenance' ? 'secondary' : 'destructive'
                                        }>
                                            {vehicle.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditClick(vehicle)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    <span>Edit</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(vehicle)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
        
        <VehicleSheet 
            open={isSheetOpen}
            onOpenChange={setIsSheetOpen}
            vehicleToEdit={selectedVehicle}
        />

        {vehicleToDelete && (
            <DeleteVehicleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onConfirm={confirmDelete}
                vehicleName={vehicleToDelete.name}
            />
        )}
        </>
    )
}
