import numpy as np
import random
import matplotlib.pyplot as plt
import time

# Fungsi untuk menghitung jarak Euclidean antara dua kota
def calculate_distance(city1, city2):
    return np.sqrt((city1[0] - city2[0])**2 + (city1[1] - city2[1])**2)

# Fungsi untuk menghitung total panjang tour
def total_tour_distance(tour, cities):
    dist = 0
    n = len(tour)
    for i in range(n):
        city_a = cities[tour[i]]
        city_b = cities[tour[(i + 1) % n]]
        dist += calculate_distance(city_a, city_b)
    return dist

# 3. Cheapest Insertion
def cheapest_insertion_tsp(cities):
    n = len(cities)
    tour = [0, 1] # Mulai dari 2 kota pertama
    unvisited = set(range(n)) - {0, 1}
    
    while unvisited:
        best_increase = float('inf')
        best_city = None
        best_pos = None
        
        for city in unvisited:
            for i in range(len(tour)):
                c1 = tour[i]
                c2 = tour[(i + 1) % len(tour)]
                # Peningkatan biaya jika disisipkan di antara c1 dan c2
                increase = calculate_distance(cities[c1], cities[city]) + \
                           calculate_distance(cities[city], cities[c2]) - \
                           calculate_distance(cities[c1], cities[c2])
                if increase < best_increase:
                    best_increase = increase
                    best_city = city
                    best_pos = i + 1
                    
        tour.insert(best_pos, best_city)
        unvisited.remove(best_city)
    return tour