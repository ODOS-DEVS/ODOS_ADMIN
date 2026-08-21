import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  Box,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  getCustomerMetrics,
  getRevenueMetrics,
  getProductMetrics,
  getInventoryMetrics,
  getCategoryPerformance,
  getVendorMetrics,
  getSegmentsOverview,
  getChurnRiskUsers,
  exportSegmentForCampaign,
} from '@/api/advancedAnalyticsApi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

function TabPanel(props: any) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export function AdvancedAnalyticsDashboardPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customer metrics
  const [customerMetrics, setCustomerMetrics] = useState<any>(null);

  // Revenue metrics
  const [revenueMetrics, setRevenueMetrics] = useState<any>(null);

  // Product metrics
  const [productMetrics, setProductMetrics] = useState<any>(null);

  // Inventory metrics
  const [inventoryMetrics, setInventoryMetrics] = useState<any>(null);

  // Category performance
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Vendor metrics
  const [vendorMetrics, setVendorMetrics] = useState<any>(null);

  // Customer segments
  const [segments, setSegments] = useState<any[]>([]);

  // Churn risk users
  const [churnRiskUsers, setChurnRiskUsers] = useState<any[]>([]);
  const [showChurnDetail, setShowChurnDetail] = useState(false);

  // Export dialog
  const [exportSegment, setExportSegment] = useState<string | null>(null);
  const [exportData, setExportData] = useState<any>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        customers,
        revenue,
        products,
        inventory,
        categories,
        vendors,
        segmentsData,
        churnRisk,
      ] = await Promise.all([
        getCustomerMetrics(),
        getRevenueMetrics(),
        getProductMetrics(),
        getInventoryMetrics(),
        getCategoryPerformance(),
        getVendorMetrics(),
        getSegmentsOverview(),
        getChurnRiskUsers(),
      ]);

      setCustomerMetrics(customers.data);
      setRevenueMetrics(revenue.data);
      setProductMetrics(products.data);
      setInventoryMetrics(inventory.data);
      setCategoryData(categories.data);
      setVendorMetrics(vendors.data);
      setSegments(segmentsData.data?.segments || []);
      setChurnRiskUsers(churnRisk.data?.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSegment = async (segment: string) => {
    try {
      const data = await exportSegmentForCampaign(segment);
      setExportSegment(segment);
      setExportData(data);
    } catch (err) {
      alert('Failed to export segment');
    }
  };

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          aria-label="analytics tabs"
        >
          <Tab label="Overview" id="analytics-tab-0" />
          <Tab label="Revenue" id="analytics-tab-1" />
          <Tab label="Products & Inventory" id="analytics-tab-2" />
          <Tab label="Customer Segmentation" id="analytics-tab-3" />
          <Tab label="Churn Analysis" id="analytics-tab-4" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          {/* Customer Metrics */}
          {customerMetrics && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Total Customers</Box>
                    <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {customerMetrics.total_customers.toLocaleString()}
                    </Box>
                    <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}>
                      +{customerMetrics.new_customers_today} today
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Active Customers</Box>
                    <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {customerMetrics.active_customers.toLocaleString()}
                    </Box>
                    <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}>
                      {((customerMetrics.active_customers / customerMetrics.total_customers) * 100).toFixed(1)}% active
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Avg Lifetime Value</Box>
                    <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      GHS {customerMetrics.average_lifetime_value.toFixed(2)}
                    </Box>
                    <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}>
                      Retention: {(customerMetrics.retention_rate * 100).toFixed(1)}%
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Vendor Metrics */}
          {vendorMetrics && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Total Vendors</Box>
                    <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {vendorMetrics.total_vendors}
                    </Box>
                    <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}>
                      {vendorMetrics.active_vendors} active
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Avg Vendor Rating</Box>
                    <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {vendorMetrics.avg_vendor_rating.toFixed(2)} ⭐
                    </Box>
                    <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}>
                      {vendorMetrics.avg_vendor_products} products avg
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Top Vendor</Box>
                    <Box sx={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {vendorMetrics.top_vendor.name}
                    </Box>
                    <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mt: 1 }}>
                      GHS {vendorMetrics.top_vendor.revenue.toLocaleString()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Product Metrics */}
          {productMetrics && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Product Health" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          Total Products
                        </Box>
                        <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                          {productMetrics.total_products}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 2, bgcolor: '#fef3cd', borderRadius: 1 }}>
                        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          Low Stock
                        </Box>
                        <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9800' }}>
                          {productMetrics.low_stock_count}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 2, bgcolor: '#f8d7da', borderRadius: 1 }}>
                        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          Out of Stock
                        </Box>
                        <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f44336' }}>
                          {productMetrics.out_of_stock_count}
                        </Box>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ p: 2, bgcolor: '#d4edda', borderRadius: 1 }}>
                        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                          Avg Rating
                        </Box>
                        <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4caf50' }}>
                          {productMetrics.avg_rating.toFixed(1)} ⭐
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Revenue Tab */}
      <TabPanel value={tab} index={1}>
        <Grid container spacing={3}>
          {revenueMetrics && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Total Revenue</Box>
                    <Box sx={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                      GHS {revenueMetrics.total_revenue.toLocaleString()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Today</Box>
                    <Box sx={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                      GHS {revenueMetrics.revenue_today.toLocaleString()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>7 Days</Box>
                    <Box sx={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                      GHS {revenueMetrics.revenue_7d.toLocaleString()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>30 Days</Box>
                    <Box sx={{ fontSize: '1.75rem', fontWeight: 'bold' }}>
                      GHS {revenueMetrics.revenue_30d.toLocaleString()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {/* Category Performance Chart */}
          {categoryData.length > 0 && (
            <Grid item xs={12} lg={6}>
              <Card>
                <CardHeader title="Revenue by Category" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Growth Rates */}
          {categoryData.length > 0 && (
            <Grid item xs={12} lg={6}>
              <Card>
                <CardHeader title="Category Growth" />
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="growth_rate" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Products & Inventory Tab */}
      <TabPanel value={tab} index={2}>
        <Grid container spacing={3}>
          {inventoryMetrics && (
            <>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Total Inventory Value</Box>
                    <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      GHS {inventoryMetrics.total_value.toLocaleString()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Total Units</Box>
                    <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {inventoryMetrics.total_units.toLocaleString()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 1 }}>Stock Turnover</Box>
                    <Box sx={{ fontSize: '2rem', fontWeight: 'bold' }}>
                      {inventoryMetrics.stock_turnover_rate.toFixed(2)}x
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
          {productMetrics && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Top Products" />
                <CardContent>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Sales</TableCell>
                          <TableCell align="right">Revenue</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {productMetrics.top_products &&
                          productMetrics.top_products.map((product: any) => (
                            <TableRow key={product.id}>
                              <TableCell>{product.title}</TableCell>
                              <TableCell align="right">{product.sales}</TableCell>
                              <TableCell align="right">
                                GHS {product.revenue.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </TabPanel>

      {/* Customer Segmentation Tab */}
      <TabPanel value={tab} index={3}>
        <Grid container spacing={3}>
          {segments.length > 0 && (
            <>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Customer Segments Overview" />
                  <CardContent>
                    <Grid container spacing={2}>
                      {segments.map((segment) => (
                        <Grid item xs={12} sm={6} md={4} key={segment.segment}>
                          <Paper sx={{ p: 2 }}>
                            <Box sx={{ textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 'bold', mb: 1 }}>
                              {segment.segment}
                            </Box>
                            <Box sx={{ fontSize: '1.75rem', fontWeight: 'bold', mb: 2 }}>
                              {segment.user_count.toLocaleString()}
                            </Box>
                            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                              Lifetime Spend: GHS{segment.avg_lifetime_spend.toFixed(2)}
                            </Box>
                            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 2 }}>
                              Engagement: {segment.engagement_score.toFixed(2)}/1
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              fullWidth
                              onClick={() => handleExportSegment(segment.segment)}
                            >
                              Export
                            </Button>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Segment Distribution */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader title="Customer Distribution" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={segments}
                          dataKey="user_count"
                          nameKey="segment"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {segments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Engagement Distribution */}
              <Grid item xs={12} lg={6}>
                <Card>
                  <CardHeader title="Engagement by Segment" />
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={segments}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="segment" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="engagement_score" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </TabPanel>

      {/* Churn Analysis Tab */}
      <TabPanel value={tab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="High Churn Risk Customers"
                action={
                  <Button onClick={() => setShowChurnDetail(!showChurnDetail)}>
                    {showChurnDetail ? 'Hide' : 'Show'} Details
                  </Button>
                }
              />
              <CardContent>
                {churnRiskUsers.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Email</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell align="right">Churn Risk Score</TableCell>
                          <TableCell align="right">Lifetime Spend</TableCell>
                          <TableCell>Segment</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {churnRiskUsers.slice(0, 10).map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${(user.churn_risk_score * 100).toFixed(0)}%`}
                                color={user.churn_risk_score > 0.8 ? 'error' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">
                              GHS {user.lifetime_spend.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip label={user.segment} size="small" />
                            </TableCell>
                            <TableCell>
                              <Button size="small" variant="outlined">
                                Send Offer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No high-risk customers found</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Export Dialog */}
      <Dialog
        open={!!exportSegment}
        onClose={() => {
          setExportSegment(null);
          setExportData(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Segment: {exportSegment}</DialogTitle>
        <DialogContent>
          {exportData && (
            <Box sx={{ py: 2 }}>
              <Box sx={{ mb: 2 }}>
                <strong>{exportData.count} users</strong> in this segment
              </Box>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => downloadCsv(exportData.csv, `${exportSegment}_users.csv`)}
                  sx={{ mb: 1 }}
                >
                  Download CSV
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    navigator.clipboard.writeText(exportData.emails.join('\n'));
                    alert('Emails copied to clipboard');
                  }}
                >
                  Copy Email List
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
}
