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

# 2-opt Optimization
def opt_2(tour, cities):
    n = len(tour)
    improved = True
    best_tour = list(tour)
    best_dist = total_tour_distance(best_tour, cities)
    
    while improved:
        improved = False
        for i in range(n - 1):
            for j in range(i + 2, n + (1 if i > 0 else 0)):
                if j - i == 1: continue
                new_tour = best_tour[:]
                new_tour[i:j] = best_tour[i:j][::-1] # Balikkan segmen
                new_dist = total_tour_distance(new_tour, cities)
                if new_dist < best_dist:
                    best_tour = new_tour
                    best_dist = new_dist
                    improved = True
                    break
            if improved: break
    return best_tour