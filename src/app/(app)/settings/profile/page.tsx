import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfileSettingsPage() {
  return (
    <>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4 w-full">
            <div>
              <Label>First Name</Label>
              <Input
                placeholder="John"
                defaultValue="Ugochukwu"
                name="firstName"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                placeholder="Doe"
                defaultValue="Osi-Okeke"
                name="lastName"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                disabled
                placeholder="john.doe@example.com"
                defaultValue="josiokeke@gmail.com"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                placeholder="+1 (555) 123-4567"
                defaultValue="08029288059"
                name="phone"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <select
                name="gender"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <Label>Address</Label>
              <Input
                placeholder="Enter your address"
                defaultValue="3 Giraffe Street Zoo Estate"
                name="address"
              />
            </div>
          </div>
          <Button className="mt-4">Save Changes</Button>
        </div>
      </CardContent>
    </>
  );
}
